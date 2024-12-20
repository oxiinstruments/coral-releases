import urllib.request, json 
import logging
import os

// Usage: python /home/u830-gps6wpvwmayd/www/oxiinstruments.com/public_html/dfu-updater/app/download_job/download_job.py

def open_url(request):
  try:
    return urllib.request.urlopen(request)
  except urllib.error.HTTPError as e:
    logging.error(f"An error occurred {e}")
    return e


logging.basicConfig(
    format='%(asctime)s %(levelname)-8s %(message)s',
    filename='download_job.log', encoding='utf-8',
    level=logging.DEBUG,
    datefmt='%Y-%m-%d %H:%M:%S')

latest_releases_url = "https://api.github.com/repos/oxiinstruments/coral-releases/releases/latest"
result = open_url(latest_releases_url)
data = json.load(result)
version = data['name']
url = data['assets'][0]['browser_download_url']
name = data['assets'][0]['name']
cwd = os.path.dirname(__file__)
destination = os.path.abspath(os.path.join(cwd, '..', '..', 'coral-firmware', name))

try:
    if os.path.exists(destination):
        logging.info(f"File {name} already exists")
    else:
        urllib.request.urlretrieve(url, destination)
        logging.info(f"Successfully downloaded {name}")
except Exception as e:
    logging.error(f"An error occurred {e}")

