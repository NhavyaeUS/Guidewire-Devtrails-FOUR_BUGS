# Adversarial Defense & Anti-Spoofing Strategy

This README outlines our **multi-layered defense architecture** against GPS spoofing fraud in delivery platforms. It addresses the "Market Crash" scenario: 500+ delivery partners using fake GPS, fake accounts, and coordinated tactics to drain payouts while appearing legitimate. [bureau](https://bureau.id/resources/blog/detect-location-gps-spoofing)

Inspired by real fraud patterns and proven techniques like INS-GPS fusion from US8922427B2. [trustdecision](https://trustdecision.com/articles/ride-hailing-apps-fraud)


## 1. Threat Model


### GPS Spoofing
Attackers use apps like Fake GPS to simulate movement. They park near restaurants, spoof long routes to claim high payouts, or "teleport" to mark deliveries complete without visiting drop-offs. Real-world example: Fraudsters complete orders from their homes, exploiting poor verification. [bureau](https://bureau.id/resources/blog/detect-location-gps-spoofing)

### Fake Accounts
Rings spin up hundreds of low-effort accounts on emulators or shared devices. These farm incentives by repeating the same spoofed routes or addresses, then vanish. [bureau](https://bureau.id/resources/blog/detect-location-gps-spoofing)

### Coordinated Payouts
500 partners sync attacks during peak payout windows (e.g., end-of-day bonuses). They mimic "stranded workers" with uniform patterns: no real movement, clustered fake drops, timed claims. [bureau](https://bureau.id/resources/blog/detect-location-gps-spoofing)


## 2. Detection Strategy


### Individual Level
- **Impossible speed detection**: Calculate velocity between pings. Flag if > realistic vehicle max (e.g., 80 km/h bike in traffic) or zero speed during "travel." [bureau](https://bureau.id/resources/blog/detect-location-gps-spoofing)
- **Location jumps**: Detect gaps > expected travel time (e.g., 5 km in 1 min). Use Haversine distance vs. timestamp delta. [bureau](https://bureau.id/resources/blog/detect-location-gps-spoofing)
- **Device fingerprinting**: Track persistent traits (IMEI proxy, OS build, screen res, rooted status). Multiple accounts per device = instant red flag. [bureau](https://bureau.id/resources/blog/detect-location-gps-spoofing)
- **Sensor mismatch (GPS vs. accelerometer)**: Phone IMU (accel/gyro) must match GPS motion. Spoofers fake coords but can't simulate road vibrations/turns. Compare INS-derived trajectory (integrated accel) to GPS; large residuals indicate spoof (per US8922427B2 sequential hypothesis test). [trustdecision](https://trustdecision.com/articles/ride-hailing-apps-fraud)

### Group Level
- **Same patterns across users**: Cluster trajectories by shape/speed profile using simple vector similarity. Identical paths from different accounts = ring.
- **Same routes/clusters**: Heatmap drop-offs; >10x density in one building (e.g., 50 "deliveries" to same apartment) flags farm.
- **Time-based coordination**: Spike detection on new accounts activating together, or synced "issues" (e.g., 100 "network drops" in 30 min). [bureau](https://bureau.id/resources/blog/detect-location-gps-spoofing)


## 3. Anti-Spoofing Techniques


- **Sensor fusion (GPS + WiFi + cell tower)**: GPS alone is weak; triangulate with WiFi BSSID geolocs (accuracy ~20m) and cell IDs (~100m). Mismatch (GPS in suburbs, WiFi in city center) blocks payout. [bureau](https://bureau.id/resources/blog/detect-location-gps-spoofing)
- **Background movement validation**: Poll IMU/GPS every 10s. Real trips show accel variance (bumps, stops); spoofed = flat signals despite "motion." [trustdecision](https://trustdecision.com/articles/ride-hailing-apps-fraud)
- **Random verification challenges**: 5% of trips: Snap drop-off proof, share live location PIN with customer, or tilt phone for gyro check. Adaptive: higher for risky zones.
- **Trusted zones/checkpoints**: Mandate fusion + photo at verified restaurants/hubs. Outside zones? Double IMU checks. [bureau](https://bureau.id/resources/blog/detect-location-gps-spoofing)


## 4. Risk Scoring System


Every courier/trip gets a dynamic **Fraud Risk Score** from 0-100, updated real-time. The score combines four weighted categories:

**Behavioral signals (40% weight)** track trip anomalies like impossible speeds, location jumps, dispute rates, and challenge compliance. Each impossible speed incident adds +20 points, but clean trips gradually decay the score over time. [bureau](https://bureau.id/resources/blog/detect-location-gps-spoofing)

**Device signals (20% weight)** analyze fingerprint consistency, rooted/jailbroken status, and account count per device. Shared devices across multiple accounts add +30 points instantly, while consistent hardware use subtracts -10 points. [trustdecision](https://trustdecision.com/articles/ride-hailing-apps-fraud)

**Network/graph signals (25% weight)** measure connections to known bad actors through shared IPs, addresses, or simultaneous activity windows. Being linked to a flagged fraud ring adds +40 points; time-synchronized activity bursts add +15 points. [bureau](https://bureau.id/resources/blog/detect-location-gps-spoofing)

**Historical reputation (15% weight)** considers tenure, total completed trips, on-time performance, and past dispute resolutions. Couriers with 100+ legitimate trips earn -20 points; recent disputes add +10 points. [bureau](https://bureau.id/resources/blog/detect-location-gps-spoofing)

The final score uses a weighted sum with Bayesian updates from historical priors (new accounts start at base +10). Thresholds divide actions: scores under 30 are clean, 30-70 trigger monitoring, and over 70 demand intervention. [trustdecision](https://trustdecision.com/articles/ride-hailing-apps-fraud)


## 5. Action Layer


Actions scale progressively with risk score to balance security and operational continuity:

**Low risk (score <30)** receives full approval with instant payouts and no additional checks. This handles the honest majority (95%+ of workers) efficiently while maintaining trust and speed. [bureau](https://bureau.id/resources/blog/detect-location-gps-spoofing)

**Medium risk (score 30-70)** triggers warnings and lightweight verification like random challenges or 15-minute payout holds. If IMU mismatch or other signals escalate during verification, the case moves to high-risk protocols. [bureau](https://bureau.id/resources/blog/detect-location-gps-spoofing)

**High risk (score >70)** activates blocking measures: no new orders accepted, payouts frozen pending review, and automatic ops notification. Strong graph signals confirming ring coordination justify these firm actions. [bureau](https://bureau.id/resources/blog/detect-location-gps-spoofing)

Escalation automatically notifies operations teams, while clean verification proofs trigger immediate de-escalation.


## 6. Fairness Mechanism


**Core principle**: We flag risky behavior, not people. Honest workers facing genuine issues get protection through multiple safeguards.

**Confidence-based decisions** incorporate uncertainty margins (e.g., ±10 points from sensor noise or network issues). Low-confidence flags only trigger soft actions like warnings, never immediate blocks.

**Temporary holds replace permanent bans** with maximum 24-hour freezes per incident. Holds automatically lift upon proof submission like customer confirmation or alternative evidence.

**Appeal system** offers one-tap in-app submission for photos, call logs, or explanations. 80% of appeals receive review within 1 hour, with automatic refunds for upheld cases.

**Human override capability** exists through an operations dashboard that flags "stranded-like" scenarios (bad weather zones, network outages) for manual waivers. We target false positive rates below 1% through continuous A/B testing. [bureau](https://bureau.id/resources/blog/detect-location-gps-spoofing)

**UX balance for honest workers**: Lifetime challenge rates stay under 5% for clean accounts. Stranded workers receive grace periods (10-minute network buffers) plus guaranteed appeal paths.


## 7. Real-Time Monitoring


**Live dashboards** display heatmaps of risk scores, interactive graph visualizations of emerging rings, and anomaly detection for city-wide score spikes.

**Automated alerts** trigger PagerDuty notifications for critical thresholds like 50 new accounts activating in one zone or 20% city-wide risk increases.

**Auto ring detection** uses graph community detection algorithms to surface suspicious clusters. Entire networks with average scores above 80 trigger automatic quarantine protocols. [bureau](https://bureau.id/resources/blog/detect-location-gps-spoofing)


## Differentiation: Stranded vs. Spoofer


**Genuine stranded worker** (flat tire, bad weather) shows real IMU movement before the issue, WiFi/cell consistency with their actual location, isolated incidents, clean history, and matching customer communications. Scores typically stay under 40 with quick appeal resolution. [trustdecision](https://trustdecision.com/articles/ride-hailing-apps-fraud)

**Spoofer/bad actor** reveals flat IMU despite reported travel, GPS/WiFi mismatches, repeated patterns across trips/accounts, graph connections to rings, and timing aligned with payout bursts. Multi-signal confirmation pushes scores above 70 for hard blocks. [trustdecision](https://trustdecision.com/articles/ride-hailing-apps-fraud)

**Key differentiator**: Physics-based IMU signals (hard to fake) combined with network context reliably separates one-off human issues from scripted, coordinated fraud. [trustdecision](https://trustdecision.com/articles/ride-hailing-apps-fraud)


