import urllib.request
import re

url = "https://carsandbids.com/auctions/3vNALWGd/1983-audi-quattro"
req = urllib.request.Request(
    url, 
    headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
)

try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        # Extract title
        title = re.search(r'<title>(.*?)</title>', html)
        print("Title:", title.group(1) if title else "None")
        
        # Check for grid classes or bidding section
        if "bidding" in html.lower():
            print("Found bidding section")
            
        # extract some structure
        from html.parser import HTMLParser
        class MyHTMLParser(HTMLParser):
            def __init__(self):
                super().__init__()
                self.classes = []
            def handle_starttag(self, tag, attrs):
                for attr in attrs:
                    if attr[0] == 'class':
                        self.classes.extend(attr[1].split())
                        
        parser = MyHTMLParser()
        parser.feed(html)
        from collections import Counter
        print("Top classes:", Counter(parser.classes).most_common(20))
        
except Exception as e:
    print("Error:", e)
