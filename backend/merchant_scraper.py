import os
import json
import time
from tavily import TavilyClient
from openai import OpenAI
from dotenv import load_dotenv

# Load env variables if not already loaded
load_dotenv()

TAVILY_API_KEY = os.environ.get("TAVILY_API_KEY")
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
OPENROUTER_PROXY_BASE_URL = os.environ.get("OPENROUTER_PROXY_BASE_URL")
OPENROUTER_PROXY_SESSION_TOKEN = os.environ.get("OPENROUTER_PROXY_SESSION_TOKEN")
OPENROUTER_HTTP_REFERER = os.environ.get("OPENROUTER_HTTP_REFERER", "https://localhost")
OPENROUTER_APP_TITLE = os.environ.get("OPENROUTER_APP_TITLE", "Generative City Wallet")

# Default to intent model for extraction as it's typically fine for this
OPENROUTER_MODEL = os.environ.get("OPENROUTER_INTENT_MODEL", "nvidia/nemotron-3-nano-30b-a3b:free")

class MerchantScraper:
    def __init__(self):
        if TAVILY_API_KEY:
            self.tavily_client = TavilyClient(api_key=TAVILY_API_KEY)
        else:
            self.tavily_client = None
            print("Warning: TAVILY_API_KEY not set.")
            
        if OPENROUTER_API_KEY or OPENROUTER_PROXY_SESSION_TOKEN:
            use_proxy = bool(OPENROUTER_PROXY_BASE_URL)
            base_url = OPENROUTER_PROXY_BASE_URL if use_proxy else "https://openrouter.ai/api/v1"
            api_key = OPENROUTER_PROXY_SESSION_TOKEN if use_proxy else OPENROUTER_API_KEY
            
            headers = {
                "HTTP-Referer": OPENROUTER_HTTP_REFERER,
                "X-Title": OPENROUTER_APP_TITLE
            }
            
            # Point openai client to OpenRouter or Proxy
            self.llm_client = OpenAI(
                base_url=base_url,
                api_key=api_key,
                default_headers=headers
            )
        else:
            self.llm_client = None
            print("Warning: OPENROUTER_API_KEY or proxy session token not set.")

    def auto_fill_merchant(self, query: str) -> dict:
        """
        Uses Tavily to search for the merchant details (category, hours, address)
        based on a Google Maps URL or a business name, then uses OpenRouter to
        extract the structured JSON data.
        """
        if not self.tavily_client:
            return {"error": "Tavily client not initialized (missing API key)."}
            
        print(f"Scraping info for: {query}")
        
        # 1. Search using Tavily (with simple retries)
        search_results = None
        attempts = 0
        while attempts < 3:
            try:
                search_results = self.tavily_client.search(
                    query=f"Find the business category, address, and opening hours for: {query}",
                    search_depth="advanced",
                    max_results=3,
                    include_answer=True
                )
                break
            except Exception as e:
                attempts += 1
                print(f"Tavily search attempt {attempts} failed: {e}")
                time.sleep(2)
                
        if not search_results:
            return {"error": "Failed to retrieve search results from Tavily after retries."}
            
        answer = search_results.get("answer", "")
        raw_text = answer + "\n\n" + "\n".join([r.get("content", "") for r in search_results.get("results", [])])

        # 2. Extract structured data using OpenRouter
        suggested_profile = {
            "name": "Unknown",
            "category": "Unknown",
            "address": "Unknown",
            "business_hours": {}
        }
        
        if self.llm_client:
            try:
                prompt = f"""
                Extract the business profile from the following search results for '{query}'.
                Return ONLY valid JSON with no markdown formatting.
                
                Required JSON structure:
                {{
                  "name": "Business Name",
                  "category": "Main business category (e.g., Cafe, Restaurant, Retail)",
                  "address": "Full physical address",
                  "business_hours": {{
                    "Monday": "09:00-17:00",
                    "Tuesday": "09:00-17:00",
                    "Wednesday": "09:00-17:00",
                    "Thursday": "09:00-17:00",
                    "Friday": "09:00-17:00",
                    "Saturday": "09:00-17:00",
                    "Sunday": "Unknown"
                  }}
                }}
                
                Important Rule: If the business hours are not mentioned in the search results, output "Unknown" instead of "Closed".
                
                Search Results:
                {raw_text}
                """
                
                completion = self.llm_client.chat.completions.create(
                    model=OPENROUTER_MODEL,
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"}
                )
                
                content = completion.choices[0].message.content
                # Sometimes models return markdown blocks despite json_object format
                if content.startswith("```json"):
                    content = content[7:-3]
                elif content.startswith("```"):
                    content = content[3:-3]
                
                extracted = json.loads(content.strip())
                suggested_profile.update(extracted)
                
            except Exception as e:
                print(f"Failed to extract with LLM: {e}")
                suggested_profile["error"] = "LLM extraction failed, using raw results."

        return {
            "ai_summary": answer,
            "suggested_profile": suggested_profile
        }

if __name__ == "__main__":
    # Test example
    scraper = MerchantScraper()
    print(json.dumps(scraper.auto_fill_merchant("DSV-Gruppe Stuttgart"), indent=2))
