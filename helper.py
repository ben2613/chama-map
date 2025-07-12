# read all lines of japan2.geojson
import json


with open('public/data/japan2.geojson', 'r', encoding='utf-8') as f:
    lines = f.readlines()

    # remove all lines that contain "properties"
    lines = [line for line in lines if "properties"in line]
    # line sample "properties": { "nam": "Tochigi Ken", "nam_ja": "栃木県", "id": 9 }
    # make a map of nam to property
    nam_to_property = {}
    for line in lines:
        property = json.loads("{" + line + "}")["properties"]
        nam_to_property[property["nam"]] = property
    # open japan-prefectures.geojson
    with open('public/data/japan-prefectures.geojson', 'r', encoding='utf-8') as f:
        japan_prefectures = json.load(f)
    # find all properties that have only nam
    for feature in japan_prefectures["features"]:
        if "properties" in feature and "nam" in feature["properties"]:
            feature["properties"] = nam_to_property[feature["properties"]["nam"]]
    # write to japan-prefectures.geojson
    with open('public/data/japan-prefectures-test.geojson', 'w', encoding='utf-8') as f:
        json.dump(japan_prefectures, f, ensure_ascii=False, separators=(',', ':'))
