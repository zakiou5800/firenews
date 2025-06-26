from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
import uuid
import re
from app.libs.news_scraper import get_all_algeria_fire_news

router = APIRouter(prefix="/api/fires", tags=["fires"])

class FireLocation(BaseModel):
    lat: float = Field(..., description="Latitude coordinate")
    lon: float = Field(..., description="Longitude coordinate")
    wilaya: str = Field(..., description="Wilaya (province) name")
    wilaya_code: Optional[int] = Field(None, description="Official wilaya code")

class FireIncident(BaseModel):
    id: str = Field(..., description="Unique incident identifier")
    location: FireLocation
    timestamp: str = Field(..., description="Incident timestamp")
    severity: str = Field(..., description="Fire severity level")
    status: str = Field(..., description="Current fire status")
    description: str = Field(..., description="Incident description")
    link: str = Field(..., description="Source article link")
    source: str = Field(..., description="News source")
    confidence: float = Field(..., description="Location extraction confidence (0-1)")
    
    # Enhanced AI analysis fields
    fire_type: Optional[str] = Field(None, description="Type of fire (forest, urban, industrial, etc.)")
    casualties: Optional[str] = Field(None, description="Casualties and injuries if mentioned")
    emergency_services: Optional[str] = Field(None, description="Emergency services involved")
    affected_area: Optional[str] = Field(None, description="Affected area details")
    cause: Optional[str] = Field(None, description="Fire cause if mentioned")
    weather_conditions: Optional[str] = Field(None, description="Weather conditions affecting fire")
    evacuation_info: Optional[str] = Field(None, description="Evacuation information if available")
    damage_assessment: Optional[str] = Field(None, description="Damage assessment if mentioned")
    date_mentioned: Optional[str] = Field(None, description="Specific date/time mentioned in article")
    ai_enhanced: bool = Field(False, description="Whether AI analysis provided enhanced details")

def extract_location_from_title(title: str, summary: str = "") -> tuple[Optional[str], float]:
    """
    Extracts a wilaya name from the article title and summary with confidence score.
    Returns tuple of (wilaya_name, confidence_score)
    """
    # Enhanced list of Algerian wilayas with alternatives and Arabic names
    wilayas_map = {
        # Code: (Primary name, [alternatives], [arabic_names])
        1: ("Adrar", ["Adrar"], ["أدرار"]),
        2: ("Chlef", ["Chlef", "El Asnam"], ["الشلف"]),
        3: ("Laghouat", ["Laghouat"], ["الأغواط"]),
        4: ("Oum El Bouaghi", ["Oum El Bouaghi", "Oum el Bouaghi"], ["أم البواقي"]),
        5: ("Batna", ["Batna"], ["باتنة"]),
        6: ("Béjaïa", ["Bejaia", "Béjaïa", "Bgayet"], ["بجاية"]),
        7: ("Biskra", ["Biskra"], ["بسكرة"]),
        8: ("Béchar", ["Bechar", "Béchar"], ["بشار"]),
        9: ("Blida", ["Blida"], ["البليدة"]),
        10: ("Bouira", ["Bouira"], ["البويرة"]),
        11: ("Tamanrasset", ["Tamanrasset", "Tamanghasset"], ["تمنراست"]),
        12: ("Tébessa", ["Tebessa", "Tébessa"], ["تبسة"]),
        13: ("Tlemcen", ["Tlemcen"], ["تلمسان"]),
        14: ("Tiaret", ["Tiaret"], ["تيارت"]),
        15: ("Tizi Ouzou", ["Tizi Ouzou", "Tizi-Ouzou"], ["تيزي وزو"]),
        16: ("Algiers", ["Alger", "Algiers", "Dzayer"], ["الجزائر"]),
        17: ("Djelfa", ["Djelfa"], ["الجلفة"]),
        18: ("Jijel", ["Jijel"], ["جيجل"]),
        19: ("Sétif", ["Setif", "Sétif"], ["سطيف"]),
        20: ("Saïda", ["Saida", "Saïda"], ["سعيدة"]),
        21: ("Skikda", ["Skikda"], ["سكيكدة"]),
        22: ("Sidi Bel Abbès", ["Sidi Bel Abbes", "Sidi Bel Abbès"], ["سيدي بلعباس"]),
        23: ("Annaba", ["Annaba"], ["عنابة"]),
        24: ("Guelma", ["Guelma"], ["قالمة"]),
        25: ("Constantine", ["Constantine"], ["قسنطينة"]),
        26: ("Médéa", ["Medea", "Médéa"], ["المدية"]),
        27: ("Mostaganem", ["Mostaganem"], ["مستغانم"]),
        28: ("M'Sila", ["Msila", "M'Sila"], ["المسيلة"]),
        29: ("Mascara", ["Mascara"], ["معسكر"]),
        30: ("Ouargla", ["Ouargla"], ["ورقلة"]),
        31: ("Oran", ["Oran", "Wahran"], ["وهران"]),
        32: ("El Bayadh", ["El Bayadh"], ["البيض"]),
        33: ("Illizi", ["Illizi"], ["إليزي"]),
        34: ("Bordj Bou Arréridj", ["Bordj Bou Arreridj", "BBA"], ["برج بوعريريج"]),
        35: ("Boumerdès", ["Boumerdes", "Boumerdès"], ["بومرداس"]),
        36: ("El Tarf", ["El Tarf"], ["الطارف"]),
        37: ("Tindouf", ["Tindouf"], ["تندوف"]),
        38: ("Tissemsilt", ["Tissemsilt"], ["تيسمسيلت"]),
        39: ("El Oued", ["El Oued"], ["الوادي"]),
        40: ("Khenchela", ["Khenchela"], ["خنشلة"]),
        41: ("Souk Ahras", ["Souk Ahras"], ["سوق أهراس"]),
        42: ("Tipaza", ["Tipaza"], ["تيبازة"]),
        43: ("Mila", ["Mila"], ["ميلة"]),
        44: ("Aïn Defla", ["Ain Defla", "Aïn Defla"], ["عين الدفلى"]),
        45: ("Naâma", ["Naama", "Naâma"], ["النعامة"]),
        46: ("Aïn Témouchent", ["Ain Temouchent", "Aïn Témouchent"], ["عين تموشنت"]),
        47: ("Ghardaïa", ["Ghardaia", "Ghardaïa"], ["غرداية"]),
        48: ("Relizane", ["Relizane"], ["غليزان"]),
        49: ("Timimoun", ["Timimoun"], ["تيميمون"]),
        50: ("Bordj Badji Mokhtar", ["Bordj Badji Mokhtar"], ["برج باجي مختار"]),
        51: ("Ouled Djellal", ["Ouled Djellal"], ["أولاد جلال"]),
        52: ("Béni Abbès", ["Beni Abbes", "Béni Abbès"], ["بني عباس"]),
        53: ("In Salah", ["In Salah"], ["عين صالح"]),
        54: ("In Guezzam", ["In Guezzam"], ["عين قزام"]),
        55: ("Touggourt", ["Touggourt"], ["تقرت"]),
        56: ("Djanet", ["Djanet"], ["جانت"]),
        57: ("El M'Ghair", ["El Mghair", "El M'Ghair"], ["المغير"]),
        58: ("El Meniaa", ["El Meniaa"], ["المنيعة"])
    }
    
    text_to_search = f"{title} {summary}".lower()
    best_match = None
    best_confidence = 0.0
    
    for code, (primary, alternatives, arabic_names) in wilayas_map.items():
        all_names = [primary] + alternatives + arabic_names
        
        for name in all_names:
            # More sophisticated matching
            pattern = r'\b' + re.escape(name.lower()) + r'\b'
            matches = re.findall(pattern, text_to_search)
            
            if matches:
                # Calculate confidence based on context and position
                confidence = 0.7  # Base confidence
                
                # Higher confidence if in title
                if name.lower() in title.lower():
                    confidence += 0.2
                
                # Higher confidence for exact matches
                if name.lower() == primary.lower():
                    confidence += 0.1
                
                # Context keywords that increase confidence
                fire_context = ["incendie", "حريق", "fire", "feu", "pompier", "civil protection"]
                if any(ctx in text_to_search for ctx in fire_context):
                    confidence += 0.1
                
                confidence = min(confidence, 1.0)  # Cap at 1.0
                
                if confidence > best_confidence:
                    best_confidence = confidence
                    best_match = primary
    
    return best_match, best_confidence

# Comprehensive coordinates for all Algerian wilayas
WILAYA_COORDINATES = {
    "Adrar": {"lat": 27.9744, "lon": -0.2841, "code": 1},
    "Chlef": {"lat": 36.1652, "lon": 1.3369, "code": 2},
    "Laghouat": {"lat": 33.8008, "lon": 2.8644, "code": 3},
    "Oum El Bouaghi": {"lat": 35.8753, "lon": 7.1135, "code": 4},
    "Batna": {"lat": 35.5559, "lon": 6.1741, "code": 5},
    "Béjaïa": {"lat": 36.7525, "lon": 5.0626, "code": 6},
    "Biskra": {"lat": 34.8481, "lon": 5.7244, "code": 7},
    "Béchar": {"lat": 31.6177, "lon": -2.2286, "code": 8},
    "Blida": {"lat": 36.4203, "lon": 2.8277, "code": 9},
    "Bouira": {"lat": 36.3736, "lon": 3.9030, "code": 10},
    "Tamanrasset": {"lat": 22.7851, "lon": 5.5281, "code": 11},
    "Tébessa": {"lat": 35.4040, "lon": 8.1244, "code": 12},
    "Tlemcen": {"lat": 34.8786, "lon": -1.3150, "code": 13},
    "Tiaret": {"lat": 35.3711, "lon": 1.3170, "code": 14},
    "Tizi Ouzou": {"lat": 36.7118, "lon": 4.0435, "code": 15},
    "Algiers": {"lat": 36.7538, "lon": 3.0588, "code": 16},
    "Djelfa": {"lat": 34.6814, "lon": 3.2631, "code": 17},
    "Jijel": {"lat": 36.8190, "lon": 5.7667, "code": 18},
    "Sétif": {"lat": 36.1914, "lon": 5.4072, "code": 19},
    "Saïda": {"lat": 34.8302, "lon": 0.1514, "code": 20},
    "Skikda": {"lat": 36.8760, "lon": 6.9095, "code": 21},
    "Sidi Bel Abbès": {"lat": 35.1977, "lon": -0.6388, "code": 22},
    "Annaba": {"lat": 36.9000, "lon": 7.7667, "code": 23},
    "Guelma": {"lat": 36.4612, "lon": 7.4286, "code": 24},
    "Constantine": {"lat": 36.3650, "lon": 6.6147, "code": 25},
    "Médéa": {"lat": 36.2639, "lon": 2.7531, "code": 26},
    "Mostaganem": {"lat": 35.9315, "lon": 0.0890, "code": 27},
    "M'Sila": {"lat": 35.7056, "lon": 4.5414, "code": 28},
    "Mascara": {"lat": 35.3968, "lon": 0.1407, "code": 29},
    "Ouargla": {"lat": 31.9539, "lon": 5.3249, "code": 30},
    "Oran": {"lat": 35.6969, "lon": -0.6331, "code": 31},
    "El Bayadh": {"lat": 33.6809, "lon": 1.0176, "code": 32},
    "Illizi": {"lat": 26.5044, "lon": 8.4667, "code": 33},
    "Bordj Bou Arréridj": {"lat": 36.0731, "lon": 4.7689, "code": 34},
    "Boumerdès": {"lat": 36.7667, "lon": 3.4167, "code": 35},
    "El Tarf": {"lat": 36.7672, "lon": 8.3137, "code": 36},
    "Tindouf": {"lat": 27.6710, "lon": -8.1676, "code": 37},
    "Tissemsilt": {"lat": 35.6075, "lon": 1.8108, "code": 38},
    "El Oued": {"lat": 33.3564, "lon": 6.8531, "code": 39},
    "Khenchela": {"lat": 35.4361, "lon": 7.1433, "code": 40},
    "Souk Ahras": {"lat": 36.2864, "lon": 7.9511, "code": 41},
    "Tipaza": {"lat": 36.5944, "lon": 2.4475, "code": 42},
    "Mila": {"lat": 36.4503, "lon": 6.2647, "code": 43},
    "Aïn Defla": {"lat": 36.2639, "lon": 1.9675, "code": 44},
    "Naâma": {"lat": 33.2667, "lon": -0.3000, "code": 45},
    "Aïn Témouchent": {"lat": 35.2981, "lon": -1.0411, "code": 46},
    "Ghardaïa": {"lat": 32.4839, "lon": 3.6736, "code": 47},
    "Relizane": {"lat": 35.7364, "lon": 0.5564, "code": 48},
    "Timimoun": {"lat": 29.2631, "lon": 0.2406, "code": 49},
    "Bordj Badji Mokhtar": {"lat": 21.3167, "lon": 0.9167, "code": 50},
    "Ouled Djellal": {"lat": 34.4167, "lon": 5.0833, "code": 51},
    "Béni Abbès": {"lat": 30.1167, "lon": -2.1667, "code": 52},
    "In Salah": {"lat": 27.2167, "lon": 2.4667, "code": 53},
    "In Guezzam": {"lat": 19.5667, "lon": 5.7667, "code": 54},
    "Touggourt": {"lat": 33.1167, "lon": 6.0667, "code": 55},
    "Djanet": {"lat": 24.5500, "lon": 9.4833, "code": 56},
    "El M'Ghair": {"lat": 33.9500, "lon": 5.9167, "code": 57},
    "El Meniaa": {"lat": 30.5833, "lon": 2.8833, "code": 58}
}

def determine_severity(title: str, summary: str) -> str:
    """
    Determine fire severity based on keywords in title and summary.
    """
    text = f"{title} {summary}".lower()
    
    # High severity indicators
    high_severity_keywords = [
        "evacuation", "évacuation", "إخلاء", "dead", "mort", "مات", "casualties", "victimes", "ضحايا",
        "destroyed", "détruit", "دمر", "emergency", "urgence", "طوارئ", "disaster", "catastrophe", "كارثة",
        "massive", "énorme", "هائل", "wildfire", "feu de forêt", "حريق غابة", "out of control", "hors de contrôle"
    ]
    
    # Medium severity indicators
    medium_severity_keywords = [
        "firefighters", "pompiers", "رجال الإطفاء", "aircraft", "avion", "طائرة", "helicopter", "hélicoptère", "مروحية",
        "spreading", "propagation", "انتشار", "threat", "menace", "تهديد", "risk", "risque", "خطر"
    ]
    
    if any(keyword in text for keyword in high_severity_keywords):
        return "Critical"
    elif any(keyword in text for keyword in medium_severity_keywords):
        return "High"
    else:
        return "Medium"

def determine_status(title: str, summary: str) -> str:
    """
    Determine fire status based on keywords.
    """
    text = f"{title} {summary}".lower()
    
    if any(keyword in text for keyword in ["contained", "maîtrisé", "تحت السيطرة", "extinguished", "éteint", "أطفئ"]):
        return "Contained"
    elif any(keyword in text for keyword in ["under control", "sous contrôle", "تحت السيطرة"]):
        return "Under Control"
    else:
        return "Active"

@router.get("/active", response_model=List[FireIncident])
async def get_active_fires():
    """
    Scrapes and returns a list of active fire incidents with enhanced location extraction.
    """
    try:
        articles = get_all_algeria_fire_news()
        incidents = []
        
        for article in articles:
            title = article.get("title", "")
            summary = article.get("summary", "")
            
            # Extract location with confidence
            wilaya_name, confidence = extract_location_from_title(title, summary)
            
            if wilaya_name and wilaya_name in WILAYA_COORDINATES:
                coords = WILAYA_COORDINATES[wilaya_name]
                location = FireLocation(
                    lat=coords["lat"], 
                    lon=coords["lon"], 
                    wilaya=wilaya_name,
                    wilaya_code=coords["code"]
                )
            else:
                # Default to Algiers center if no location found
                location = FireLocation(
                    lat=36.7538, 
                    lon=3.0588, 
                    wilaya="Unknown",
                    wilaya_code=None
                )
                confidence = 0.1  # Very low confidence for unknown location
            
            # Determine severity and status
            severity = determine_severity(title, summary)
            status = determine_status(title, summary)
            
            # Get AI result for enhanced details if available
            ai_result = article.get('ai_result', {})
            
            incident = FireIncident(
                id=f"fire-{uuid.uuid4().hex[:8]}",
                location=location,
                timestamp=article.get("published", datetime.utcnow().isoformat()),
                severity=severity,
                status=status,
                description=f"{title}: {summary}",
                link=article.get("link", ""),
                source=article.get("source", "Unknown"),
                confidence=confidence,
                # Enhanced AI analysis fields
                fire_type=ai_result.get('fire_type'),
                casualties=ai_result.get('casualties'),
                emergency_services=ai_result.get('emergency_services'),
                affected_area=ai_result.get('affected_area'),
                cause=ai_result.get('cause'),
                weather_conditions=ai_result.get('weather_conditions'),
                evacuation_info=ai_result.get('evacuation_info'),
                damage_assessment=ai_result.get('damage_assessment'),
                date_mentioned=ai_result.get('date_mentioned'),
                ai_enhanced=article.get('ai_enhanced', False)
            )
            incidents.append(incident)
        
        # Sort by confidence and timestamp
        incidents.sort(key=lambda x: (x.confidence, x.timestamp), reverse=True)
        
        return incidents
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching fire incidents: {str(e)}")

@router.get("/active/by-wilaya/{wilaya_name}", response_model=List[FireIncident])
async def get_fires_by_wilaya(wilaya_name: str):
    """
    Get fire incidents for a specific wilaya.
    """
    all_incidents = await get_active_fires()
    return [incident for incident in all_incidents if incident.location.wilaya.lower() == wilaya_name.lower()]

@router.get("/active/high-confidence", response_model=List[FireIncident])
async def get_high_confidence_fires(min_confidence: float = 0.7):
    """
    Get fire incidents with high location confidence.
    """
    all_incidents = await get_active_fires()
    return [incident for incident in all_incidents if incident.confidence >= min_confidence]

@router.get("/stats")
async def get_fire_stats():
    """
    Get statistics about current fire incidents.
    """
    incidents = await get_active_fires()
    
    stats = {
        "total_incidents": len(incidents),
        "by_severity": {},
        "by_status": {},
        "by_wilaya": {},
        "high_confidence_count": len([i for i in incidents if i.confidence >= 0.7]),
        "average_confidence": sum(i.confidence for i in incidents) / len(incidents) if incidents else 0
    }
    
    for incident in incidents:
        # By severity
        stats["by_severity"][incident.severity] = stats["by_severity"].get(incident.severity, 0) + 1
        
        # By status  
        stats["by_status"][incident.status] = stats["by_status"].get(incident.status, 0) + 1
        
        # By wilaya
        stats["by_wilaya"][incident.location.wilaya] = stats["by_wilaya"].get(incident.location.wilaya, 0) + 1
    
    return stats