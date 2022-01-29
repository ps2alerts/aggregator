import json

# Opening JSON file
f = open('./344-reverse-engineered.json')

# returns JSON object as
# a dictionary
data = json.load(f)

# Iterating through the json
# list
print(data[0])

objects = []

for i in data:
    links = i['facility_links']
    for link in links:
        dict={
            "zone_id": "344",
            "facility_id_a": i['facility_id'],
            "facility_id_b": link
        }

        objects.append(dict)

json_object = json.dumps(objects, indent = 4)

# Closing file
f.close()

with open("344-generated.json", "w") as outfile:
    outfile.write(json_object)
