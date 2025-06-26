from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Dict, Any
from app.auth import AuthorizedUser
from app.libs.news_scraper import get_all_algeria_fire_news
from app.libs.database import get_db_connection
import asyncio
from datetime import datetime
import requests
from bs4 import BeautifulSoup
import re
from urllib.parse import urljoin, urlparse
import time
import aiohttp
import json
from selectolax.parser import HTMLParser
from app.libs.gemini_ai_service import get_gemini_service

router = APIRouter(prefix="/scraping")

class CustomSource(BaseModel):
    name: str
    url: HttpUrl
    source_type: str = "website"
    selectors: List[str] = ["h1", "h2", "h3", ".title", ".headline"]

class CustomSourceResponse(BaseModel):
    id: int
    name: str
    url: str
    source_type: str
    selectors: List[str]
    is_active: bool
    created_at: str
    updated_at: str

class ScrapingModeRequest(BaseModel):
    mode: str  # "auto" or "manual"

class ManualScrapeRequest(BaseModel):
    source_ids: Optional[List[int]] = None  # If None, scrape all active sources

class ScrapeResult(BaseModel):
    source_id: Optional[int]
    source_name: str
    articles_found: int
    status: str
    error: Optional[str] = None
    duration_seconds: float
    ai_enhanced: Optional[bool] = False
    ai_confidence_avg: Optional[float] = None

class ManualScrapeResponse(BaseModel):
    total_articles: int
    results: List[ScrapeResult]
    duration_seconds: float
    ai_analysis_used: bool = False
    high_confidence_articles: int = 0



async def scrape_custom_source(source_config: Dict[str, Any], use_ai: bool = True) -> List[Dict[str, Any]]:
    """Advanced scraping with SOTA techniques and AI-powered analysis"""
    articles = []
    
    try:
        timeout = aiohttp.ClientTimeout(total=15)
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'fr,en-US;q=0.7,en;q=0.3',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        
        async with aiohttp.ClientSession(timeout=timeout, headers=headers) as session:
            async with session.get(source_config['url']) as response:
                if response.status != 200:
                    print(f"HTTP {response.status} for {source_config['name']}")
                    return []
                
                html_content = await response.text()
                
                # Use selectolax for faster HTML parsing
                tree = HTMLParser(html_content)
                
                # Extract content using multiple strategies
                selectors = source_config.get('selectors', ['h1', 'h2', 'h3', '.title', '.headline'])
                
                # Strategy 1: Custom selectors
                for selector in selectors:
                    nodes = tree.css(selector)
                    for node in nodes:
                        text = node.text(strip=True)
                        if text and len(text) > 20:
                            link = extract_link(node, source_config['url'])
                            article = create_article_object(text, link, source_config['name'])
                            if article and is_fire_related_advanced(text):
                                articles.append(article)
                
                # Strategy 2: JSON-LD structured data
                json_ld_articles = extract_json_ld_articles(html_content, source_config)
                articles.extend(json_ld_articles)
                
                # Strategy 3: Intelligent content detection
                auto_detected = auto_detect_articles(tree, source_config)
                articles.extend(auto_detected)
                
                # Deduplicate by title similarity
                articles = deduplicate_articles(articles)
                
                # AI-powered content enhancement
                if use_ai and articles:
                    print(f"Enhancing {len(articles)} articles with Gemini AI...")
                    gemini_service = get_gemini_service()
                    if gemini_service.is_available():
                        try:
                            articles = await gemini_service.analyze_batch(articles)
                            # Filter by AI confidence score
                            articles = [a for a in articles if a.get('confidence', 0) >= 0.3]
                            print(f"AI analysis complete. {len(articles)} high-confidence articles retained.")
                        except Exception as e:
                            print(f"AI enhancement failed, using fallback: {e}")
                    else:
                        print("Gemini AI not available, using standard analysis")
                
        return articles[:10]  # Limit to top 10 most relevant
        
    except asyncio.TimeoutError:
        print(f"Timeout scraping {source_config['name']}")
        return []
    except Exception as e:
        print(f"Error scraping {source_config['name']}: {e}")
        return []

def extract_link(node, base_url: str) -> str:
    """Extract link from node with fallback strategies"""
    # Try to find link in various ways
    link = node.attrs.get('href')
    if not link:
        parent = node.parent
        if parent and parent.tag == 'a':
            link = parent.attrs.get('href')
        else:
            # Look for nearby links
            siblings = parent.iter() if parent else []
            for sibling in siblings:
                if sibling.tag == 'a' and sibling.attrs.get('href'):
                    link = sibling.attrs.get('href')
                    break
    
    if link:
        return urljoin(base_url, link)
    return base_url

def extract_json_ld_articles(html_content: str, source_config: Dict) -> List[Dict]:
    """Extract articles from JSON-LD structured data"""
    articles = []
    
    try:
        # Find JSON-LD scripts
        tree = HTMLParser(html_content)
        scripts = tree.css('script[type="application/ld+json"]')
        
        for script in scripts:
            try:
                data = json.loads(script.text())
                
                # Handle different JSON-LD structures
                if isinstance(data, list):
                    data = data[0] if data else {}
                
                # Extract articles from NewsArticle or Article types
                if data.get('@type') in ['NewsArticle', 'Article']:
                    title = data.get('headline') or data.get('name', '')
                    url = data.get('url', source_config['url'])
                    summary = data.get('description', '')[:200]
                    
                    if title and is_fire_related_advanced(title):
                        articles.append({
                            'title': title,
                            'link': urljoin(source_config['url'], url),
                            'summary': summary,
                            'content': title + ' ' + summary,  # Combined for AI analysis
                            'published': extract_date(data),
                            'source': source_config['name'],
                            'confidence': 0.9,
                            'ai_enhanced': False
                        })
                        
            except json.JSONDecodeError:
                continue
                
    except Exception as e:
        print(f"Error extracting JSON-LD: {e}")
    
    return articles

def auto_detect_articles(tree, source_config: Dict) -> List[Dict]:
    """Automatically detect article patterns using heuristics"""
    articles = []
    
    # Common article container patterns
    article_selectors = [
        'article', '.article', '.post', '.news-item', '.story',
        '.entry', '.content-item', '[itemtype*="Article"]'
    ]
    
    for selector in article_selectors:
        containers = tree.css(selector)
        
        for container in containers:
            # Extract title from various heading patterns
            title_node = container.css_first('h1, h2, h3, .title, .headline, [class*="title"], [class*="headline"]')
            if title_node:
                title = title_node.text(strip=True)
                
                if title and len(title) > 15 and is_fire_related_advanced(title):
                    # Find associated link
                    link_node = container.css_first('a[href]')
                    link = extract_link(link_node, source_config['url']) if link_node else source_config['url']
                    
                    # Extract summary
                    summary_node = container.css_first('p, .summary, .excerpt, .description')
                    summary = summary_node.text(strip=True)[:200] if summary_node else ''
                    
                    articles.append({
                        'title': title,
                        'link': link,
                        'summary': summary,
                        'content': title + ' ' + summary,  # Combined for AI analysis
                        'published': 'Recent',
                        'source': source_config['name'],
                        'confidence': 0.7,
                        'ai_enhanced': False
                    })
    
    return articles

def is_fire_related_advanced(text: str) -> bool:
    """Advanced fire-related content detection with NLP-like scoring"""
    if not text or len(text) < 10:
        return False
    
    text_lower = text.lower()
    
    # High-priority fire keywords (weight: 3)
    critical_keywords = [
        'incendie', 'feu', 'brasier', 'flammes', 'brûle', 'embrasement',
        'fire', 'blaze', 'wildfire', 'forest fire', 'brush fire',
        'حريق', 'نار', 'حرائق'  # Arabic
    ]
    
    # Medium-priority keywords (weight: 2)
    medium_keywords = [
        'pompiers', 'firefighters', 'protection civile', 'evacuation',
        'smoke', 'fumée', 'burnt', 'burned', 'combustion',
        'إطفاء', 'دخان'  # Arabic
    ]
    
    # Context keywords (weight: 1)
    context_keywords = [
        'hectares', 'forêt', 'forest', 'vegetation', 'houses destroyed',
        'maisons détruites', 'emergency', 'urgence', 'alert', 'alerte'
    ]
    
    # Exclusion keywords (negative weight)
    exclusion_keywords = [
        'gunfire', 'ceasefire', 'fired from job', 'firing squad',
        'movie', 'film', 'cinema', 'game', 'jeu', 'match',
        'years ago', 'historical', 'anniversary'
    ]
    
    score = 0
    
    # Calculate weighted score
    for keyword in critical_keywords:
        if keyword in text_lower:
            score += 3
    
    for keyword in medium_keywords:
        if keyword in text_lower:
            score += 2
    
    for keyword in context_keywords:
        if keyword in text_lower:
            score += 1
    
    for keyword in exclusion_keywords:
        if keyword in text_lower:
            score -= 5
    
    # Additional pattern matching
    fire_patterns = [
        r'\d+\s*(hectares?|km²|kilometres?).*(?:brûlé|burned|détruit)',
        r'(?:incendie|fire).*(?:maîtrisé|controlled|contained)',
        r'(?:pompiers|firefighters).*(?:intervenu|responded)',
    ]
    
    for pattern in fire_patterns:
        if re.search(pattern, text_lower):
            score += 2
    
    return score >= 3

def extract_date(data: Dict) -> str:
    """Extract publication date from structured data"""
    date_fields = ['datePublished', 'dateModified', 'dateCreated']
    
    for field in date_fields:
        if data.get(field):
            try:
                # Parse and format date
                from datetime import datetime
                dt = datetime.fromisoformat(data[field].replace('Z', '+00:00'))
                return dt.strftime('%Y-%m-%d %H:%M')
            except Exception:
                return data[field]
    
    return 'Recent'

def create_article_object(title: str, link: str, source_name: str) -> Dict:
    """Create standardized article object with AI-ready structure"""
    if not title or len(title) < 10:
        return None
    
    return {
        'title': title.strip(),
        'link': link,
        'summary': f"Fire-related news from {source_name}",
        'published': 'Recent',
        'source': source_name,
        'confidence': 0.8,
        'ai_enhanced': False,
        'content': title  # Store title as content for AI analysis
    }

def deduplicate_articles(articles: List[Dict]) -> List[Dict]:
    """Remove duplicate articles using title similarity"""
    if not articles:
        return []
    
    unique_articles = []
    seen_titles = set()
    
    # Sort by confidence score (if available)
    articles.sort(key=lambda x: x.get('confidence', 0.5), reverse=True)
    
    for article in articles:
        title = article['title'].lower().strip()
        
        # Simple similarity check - could be enhanced with fuzzy matching
        is_duplicate = False
        for seen_title in seen_titles:
            # Check if titles are too similar (> 80% overlap)
            common_words = set(title.split()) & set(seen_title.split())
            if len(common_words) / max(len(title.split()), len(seen_title.split())) > 0.8:
                is_duplicate = True
                break
        
        if not is_duplicate:
            unique_articles.append(article)
            seen_titles.add(title)
    
    return unique_articles

@router.get("/sources", response_model=List[CustomSourceResponse])
async def get_custom_sources(user: AuthorizedUser):
    """Get all custom sources for the current user"""
    conn = await get_db_connection()
    try:
        rows = await conn.fetch(
            "SELECT * FROM custom_sources WHERE user_id = $1 ORDER BY created_at DESC",
            user.sub
        )
        return [
            CustomSourceResponse(
                id=row['id'],
                name=row['name'],
                url=str(row['url']),
                source_type=row['source_type'],
                selectors=row['selectors'] or [],
                is_active=row['is_active'],
                created_at=row['created_at'].isoformat(),
                updated_at=row['updated_at'].isoformat()
            )
            for row in rows
        ]
    finally:
        await conn.close()

@router.post("/sources", response_model=CustomSourceResponse)
async def add_custom_source(source: CustomSource, user: AuthorizedUser):
    """Add a new custom source for the current user"""
    conn = await get_db_connection()
    try:
        row = await conn.fetchrow(
            """
            INSERT INTO custom_sources (user_id, name, url, source_type, selectors)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            """,
            user.sub, source.name, str(source.url), source.source_type, source.selectors
        )
        return CustomSourceResponse(
            id=row['id'],
            name=row['name'],
            url=str(row['url']),
            source_type=row['source_type'],
            selectors=row['selectors'] or [],
            is_active=row['is_active'],
            created_at=row['created_at'].isoformat(),
            updated_at=row['updated_at'].isoformat()
        )
    finally:
        await conn.close()

@router.put("/sources/{source_id}", response_model=CustomSourceResponse)
async def update_custom_source(source_id: int, source: CustomSource, user: AuthorizedUser):
    """Update a custom source"""
    conn = await get_db_connection()
    try:
        row = await conn.fetchrow(
            """
            UPDATE custom_sources 
            SET name = $1, url = $2, source_type = $3, selectors = $4, updated_at = CURRENT_TIMESTAMP
            WHERE id = $5 AND user_id = $6
            RETURNING *
            """,
            source.name, str(source.url), source.source_type, source.selectors, source_id, user.sub
        )
        if not row:
            raise HTTPException(status_code=404, detail="Source not found")
        
        return CustomSourceResponse(
            id=row['id'],
            name=row['name'],
            url=str(row['url']),
            source_type=row['source_type'],
            selectors=row['selectors'] or [],
            is_active=row['is_active'],
            created_at=row['created_at'].isoformat(),
            updated_at=row['updated_at'].isoformat()
        )
    finally:
        await conn.close()

@router.delete("/sources/{source_id}")
async def delete_custom_source(source_id: int, user: AuthorizedUser):
    """Delete a custom source"""
    try:
        conn = await get_db_connection()
        
        result = await conn.execute(
            "DELETE FROM custom_sources WHERE id = $1",
            source_id
        )
        
        await conn.close()
        
        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="Source not found")
        
        return {"message": "Source deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete source: {str(e)}")

# Add new endpoint for AI analysis status
@router.get("/ai-status")
async def get_ai_status(user: AuthorizedUser) -> Dict[str, Any]:
    """Get Gemini AI service status and capabilities"""
    gemini_service = get_gemini_service()
    
    return {
        "ai_available": gemini_service.is_available(),
        "service_name": "Google Gemini 1.5 Flash",
        "capabilities": [
            "Fire incident classification",
            "Content relevance scoring",
            "Entity extraction (location, damage, casualties)",
            "Multi-language support (Arabic, French, English)",
            "Automatic summarization",
            "Urgency level assessment"
        ] if gemini_service.is_available() else [],
        "fallback_active": not gemini_service.is_available()
    }

@router.post("/sources/{source_id}/toggle")
async def toggle_source_status(source_id: int, user: AuthorizedUser):
    """Toggle active status of a custom source"""
    conn = await get_db_connection()
    try:
        row = await conn.fetchrow(
            """
            UPDATE custom_sources 
            SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND user_id = $2
            RETURNING is_active
            """,
            source_id, user.sub
        )
        if not row:
            raise HTTPException(status_code=404, detail="Source not found")
        
        return {"is_active": row['is_active']}
    finally:
        await conn.close()

@router.post("/manual-scrape", response_model=ManualScrapeResponse)
async def manual_scrape(request: ManualScrapeRequest, user: AuthorizedUser) -> ManualScrapeResponse:
    """Trigger manual scraping with AI-powered analysis"""
    start_time = asyncio.get_event_loop().time()
    results = []
    total_articles = 0
    ai_analysis_used = False
    high_confidence_articles = 0
    
    try:
        # Get database connection
        conn = await get_db_connection()
        
        # Get sources to scrape
        if request.source_ids:
            query = """SELECT id, name, url, source_type, selectors, is_active 
                      FROM custom_sources 
                      WHERE id = ANY($1) AND user_id = $2 AND is_active = true"""
            sources = await conn.fetch(query, request.source_ids, user.sub)
        else:
            query = """SELECT id, name, url, source_type, selectors, is_active 
                      FROM custom_sources 
                      WHERE user_id = $1 AND is_active = true"""
            sources = await conn.fetch(query, user.sub)
        
        # If no custom sources, fall back to default scraping
        if not sources:
            scrape_start = asyncio.get_event_loop().time()
            try:
                articles = get_all_algeria_fire_news()
                scrape_duration = asyncio.get_event_loop().time() - scrape_start
                
                results.append(ScrapeResult(
                    source_id=None,
                    source_name="Default Algeria Fire News",
                    articles_found=len(articles),
                    status="success",
                    duration_seconds=scrape_duration
                ))
                total_articles = len(articles)
            except Exception as e:
                scrape_duration = asyncio.get_event_loop().time() - scrape_start
                results.append(ScrapeResult(
                    source_id=None,
                    source_name="Default Algeria Fire News",
                    articles_found=0,
                    status="error",
                    error=str(e),
                    duration_seconds=scrape_duration
                ))
        else:
            # Check if AI is available
            gemini_service = get_gemini_service()
            use_ai = gemini_service.is_available()
            ai_analysis_used = use_ai
            
            print(f"Starting manual scrape of {len(sources)} sources with AI: {use_ai}")
            
            # Scrape each custom source
            for source in sources:
                scrape_start = asyncio.get_event_loop().time()
                try:
                    # Scrape with AI enhancement
                    articles = await scrape_custom_source({
                        'id': source['id'],
                        'name': source['name'],
                        'url': source['url'],
                        'selectors': source['selectors'] or ["h1", "h2", "h3"]
                    }, use_ai=use_ai)
                    
                    # Calculate AI metrics
                    ai_confidence_avg = None
                    if use_ai and articles:
                        confidences = [a.get('confidence', 0) for a in articles if a.get('ai_enhanced')]
                        ai_confidence_avg = sum(confidences) / len(confidences) if confidences else None
                        high_confidence_articles += len([a for a in articles if a.get('confidence', 0) >= 0.7])
                    
                    scrape_duration = asyncio.get_event_loop().time() - scrape_start
                    
                    results.append(ScrapeResult(
                        source_id=source['id'],
                        source_name=source['name'],
                        articles_found=len(articles),
                        status="success",
                        duration_seconds=scrape_duration,
                        ai_enhanced=use_ai,
                        ai_confidence_avg=ai_confidence_avg
                    ))
                    total_articles += len(articles)
                    
                    print(f"✓ {source['name']}: {len(articles)} articles found")
                    
                except Exception as e:
                    scrape_duration = asyncio.get_event_loop().time() - scrape_start
                    results.append(ScrapeResult(
                        source_id=source['id'],
                        source_name=source['name'],
                        articles_found=0,
                        status="error",
                        error=str(e),
                        duration_seconds=scrape_duration,
                        ai_enhanced=False
                    ))
                    print(f"✗ {source['name']}: Error - {e}")
        
        total_duration = asyncio.get_event_loop().time() - start_time
        
        return ManualScrapeResponse(
            total_articles=total_articles,
            results=results,
            duration_seconds=total_duration,
            ai_analysis_used=ai_analysis_used,
            high_confidence_articles=high_confidence_articles
        )
    
    except Exception as e:
        print(f"Manual scraping error: {e}")
        raise HTTPException(status_code=500, detail=f"Scraping failed: {str(e)}")
    
    finally:
        await conn.close()

@router.get("/mode")
async def get_scraping_mode(user: AuthorizedUser):
    """Get current scraping mode for user (stored in user preferences or default to auto)"""
    try:
        conn = await get_db_connection()
        
        # Get user's scraping mode preference
        query = "SELECT scraping_mode FROM user_preferences WHERE user_id = $1"
        row = await conn.fetchrow(query, user.sub)
        
        if row:
            mode = row['scraping_mode']
        else:
            # User doesn't have preferences yet, create with default
            insert_query = """
                INSERT INTO user_preferences (user_id, scraping_mode) 
                VALUES ($1, $2) 
                ON CONFLICT (user_id) DO NOTHING
                RETURNING scraping_mode
            """
            result = await conn.fetchrow(insert_query, user.sub, 'auto')
            mode = 'auto'  # Default mode
        
        await conn.close()
        return {"mode": mode}
        
    except Exception as e:
        print(f"Error getting scraping mode: {e}")
        # Return default mode if database error
        return {"mode": "auto"}

@router.post("/mode")
async def set_scraping_mode(request: ScrapingModeRequest, user: AuthorizedUser):
    """Set scraping mode for user and persist to database"""
    if request.mode not in ["auto", "manual"]:
        raise HTTPException(status_code=400, detail="Mode must be 'auto' or 'manual'")
    
    conn = None
    try:
        conn = await get_db_connection()
        
        # Upsert user preference (insert or update)
        upsert_query = """
            INSERT INTO user_preferences (user_id, scraping_mode) 
            VALUES ($1, $2) 
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                scraping_mode = EXCLUDED.scraping_mode,
                updated_at = CURRENT_TIMESTAMP
            RETURNING scraping_mode
        """
        
        result = await conn.fetchrow(upsert_query, user.sub, request.mode)
        
        if result:
            return {
                "mode": result['scraping_mode'], 
                "message": f"Scraping mode saved as {request.mode}",
                "persisted": True
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to save scraping mode")
            
    except Exception as e:
        print(f"Error setting scraping mode: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    finally:
        if conn:
            await conn.close()
