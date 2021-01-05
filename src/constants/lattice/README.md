# Lattice data

Since Census has been unreliable at times, we take the data directly out of Census and have pasted it into a file where it is parsed and sent to the TerritoryCalulator.

To update this data, visit https://census.daybreakgames.com/get/ps2:v2/facility_link?zone_id=2&c:limit=1000 and paste the content into the files in this folder by zone ID.

You need to remove the 'facility_link_list' and have it just be a flat array of objects. This was removed to make the code a little simplier and it takes all of 5 seconds to format.
