#!/usr/bin/env bash
# ===========================================================================
# download-images.sh — save every Unsplash photo used by the template into
# assets/images/photos/ (WebP) and point all pages at the local copies.
#
# Usage (from the template root, needs curl + perl — both ship with macOS/Linux;
# on Windows use Git Bash or WSL):
#     bash download-images.sh https://www.your-domain.com
# The optional domain is used for absolute og:image / JSON-LD image URLs.
#
# Before the script runs, pages load the same photos straight from Unsplash's
# CDN, so the template works out of the box. Photos: Unsplash License
# (https://unsplash.com/license) — free for commercial use, no permission needed.
# ===========================================================================
set -euo pipefail
cd "$(dirname "$0")"
DOMAIN="${1:-https://www.example.com}"
OUT="assets/images/photos"
mkdir -p "$OUT"

PHOTOS=(
  "photo-1625047509248-ec889cbff17f|hero-technician.webp"   # Technician in uniform inspecting a car
  "photo-1615906655593-ad0386982a0f|og-cover.webp"   # Mechanic working on a car engine
  "photo-1627306036351-036986f292a9|city-skyline.webp"   # City high-rises under a blue sky
  "photo-1591517487866-e7c7bf9896fb|svc-two-wheeler.webp"   # Scooter parked on a city pavement
  "photo-1573899754191-bd20f600141c|svc-car.webp"   # Blue hatchback car
  "photo-1626149637281-4e227308da18|svc-commercial.webp"   # Yellow and black auto rickshaw on the road
  "photo-1435527173128-983b87201f4d|svc-renewal.webp"   # Open monthly planner on a desk
  "photo-1692309175422-b9d614f4764e|detail-car-exhaust.webp"   # Close-up of a car's exhaust pipe
  "photo-1648204834832-78e68052c04f|detail-scooter.webp"   # Scooter parked at the roadside
  "photo-1614976523626-d598aafd4fda|detail-van.webp"   # White van on a tree-lined road
  "photo-1649298173603-9c95aa950879|detail-calendar.webp"   # Close-up of a calendar on a table
  "photo-1659536806369-0114c406a20d|car-at-home.webp"   # Car parked in front of a house
  "photo-1641784188055-5ef9486431cd|about-team.webp"   # Two men standing beside a parked car
  "photo-1637640125496-31852f042a60|about-tools.webp"   # Box of wrenches and service tools
  "photo-1530685932526-48ec92998eaa|blog-emission-limits.webp"   # Heavy traffic on a multi-lane highway at golden hour
  "photo-1529651737248-dad5e287768e|blog-renewal-calendar.webp"   # Pen resting on an open calendar
  "photo-1754548930574-6a995e5eb5a7|blog-test-checklist.webp"   # Hand ticking items off a checklist
  "photo-1623079478319-945f25f0a97b|blog-two-wheeler.webp"   # Rider on a blue motor scooter
  "photo-1639919397870-cc2c183be021|blog-failed-test.webp"   # Auto rickshaw with smoke coming from the exhaust
  "photo-1635176061729-35ca541a03a1|blog-clean-air.webp"   # City street lined with green trees
  "photo-1592890288564-76628a30a657|login-phone.webp"   # Person holding a smartphone
  "photo-1566518447933-8f9399038f23|404-empty-road.webp"   # Empty road stretching into the distance
  "photo-1762117360986-9753aef7680f|home2-hero-house.webp"   # Modern house with a car under the carport
  "photo-1642665085897-da7cf0a4946e|home2-scooter.webp"   # Woman standing next to a blue scooter
  "photo-1572634302117-74d5936414ce|home2-hatchback.webp"   # White hatchback in a parking lot
  "photo-1620455800201-7f00aeef12ed|home2-delivery-van.webp"   # Person loading boxes into a yellow delivery van
  "photo-1587813369290-091c9d432daf|home2-fleet.webp"   # Row of white vans parked in a lot
  "photo-1602951172321-fe0aa8865e6b|home2-traffic.webp"   # Cars on a city road during the day
  "photo-1759840278361-f1adc75529a1|team-ananya.webp"   # Woman in a red kurta smiling
  "photo-1649433658557-54cf58577c68|team-rahul.webp"   # Man with black hair and a beard smiling
  "photo-1768221677463-191fc4e15690|team-farah.webp"   # Young woman with dark wavy hair smiling
  "photo-1779281128550-8cc634361a17|team-dev.webp"   # Smiling man in a white polo shirt
  "photo-1687462970787-61d953508926|team-join-technician.webp"   # Woman holding a wrench in a garage
  "photo-1723099971299-3789db53604c|coming-soon-lift.webp"   # Car raised on a workshop lift
)

for row in "${PHOTOS[@]}"; do
  id="${row%%|*}"; file="${row##*|}"
  echo "↓ $file"
  curl -fsSL "https://images.unsplash.com/$id?fm=webp&w=1600&q=78" -o "$OUT/$file"
  for page in pages/*.html; do
    # absolute URLs for social cards + structured data
    perl -pi -e "s#https://images\.unsplash\.com/$id\?[^\"\s]*#$DOMAIN/$OUT/$file#g if /og:image|\"image\":/" "$page"
    # srcset lists collapse to the single local file
    perl -pi -e "s# srcset=\"[^\"]*$id[^\"]*\"##g" "$page"
    perl -pi -e "s#https://images\.unsplash\.com/$id\?[^\"\s]*#../$OUT/$file#g" "$page"
  done
done
for page in pages/*.html; do
  perl -ni -e 'print unless /rel="preconnect" href="https:\/\/images\.unsplash\.com"/' "$page"
done
echo "Done: $(ls "$OUT" | wc -l | tr -d ' ') photos saved to $OUT and linked locally."
