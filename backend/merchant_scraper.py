import os
import json
from tavily import TavilyClient
from dotenv import load_dotenv

# Load env variables if not already loaded
load_dotenv()

TAVILY_API_KEY = os.environ.get("TAVILY_API_KEY")
if not TAVILY_API_KEY:
    print("Warning: TAVILY_API_KEY not set.")

class MerchantScraper:
    def __init__(self):
        if TAVILY_API_KEY:
            self.client = TavilyClient(api_key=TAVILY_API_KEY)
        else:
            self.client = None

    def auto_fill_merchant(self, query: str) -> dict:
        """
        Uses Tavily to search for the merchant details (category, hours, address)
        based on a Google Maps URL or a business name.
        """
        if not self.client:
            return {"error": "Tavily client not initialized (missing API key)."}
            
        print(f"Scraping info for: {query}")
        try:
            # We want high quality extraction of structured info if possible
            # Tavily can do advanced search.
            response = self.client.search(
                query=f"Find the business category, address, and opening hours for: {query}",
                search_depth="advanced",
                max_results=3,
                include_answer=True
            )
            
            answer = response.get("answer", "")
            results = response.get("results", [])
            
            # Simple heuristic parsing (in production, we'd pass this to an LLM for structured JSON output)
            return {
                "ai_summary": answer,
                "raw_results": [
                    {"title": r.get("title"), "url": r.get("url"), "content": r.get("content")} 
                    for r in results
                ],
                "suggested_profile": {
                    "name": "To be extracted by LLM/User",
                    "category": "To be extracted by LLM/User",
                    "address": "To be extracted by LLM/User",
                    "business_hours": {}
                }
            }
        except Exception as e:
            return {"error": str(e)}

if __name__ == "__main__":
    # Test example
    scraper = MerchantScraper()
    print(json.dumps(scraper.auto_fill_merchant("DSV-Gruppe Stuttgart"), indent=2))
