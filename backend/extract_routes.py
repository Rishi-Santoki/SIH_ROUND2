import json

def extract():
    with open("openapi_schema.json", "r", encoding="utf-8") as f:
        schema = json.load(f)
    
    routes = []
    paths = schema.get("paths", {})
    for path, methods in paths.items():
        for method in methods.keys():
            routes.append({"method": method.upper(), "path": path})
            
    with open("current_routes.json", "w") as f:
        json.dump(routes, f, indent=2)
    print(f"Extracted {len(routes)} routes.")

if __name__ == "__main__":
    extract()
