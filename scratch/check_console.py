import os
os.environ['WDM_LOG'] = '0'
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
import json, time

chrome_options = Options()
chrome_options.add_argument('--headless')
chrome_options.add_argument('--log-level=3')
driver = webdriver.Chrome(options=chrome_options)
driver.get('http://localhost:3000')
time.sleep(2)
with open('c:/Users/pf4es/Downloads/spsu_journal-main/spsu_journal-main/scratch/logs.txt', 'w', encoding='utf-8') as f:
    for entry in driver.get_log('browser'):
        f.write(json.dumps(entry) + '\n')
driver.quit()
