# Bid YourCar 🏎️

BidYourCar web app is real-time car auctioning platform. 
* App handles:
  * secure user authentication; 
  * media uploading and delivering;
  * auction and bidding ecosystem;

[https://bidyourcar.web.app](https://bidyourcar.web.app) *(Hosted on Google Cloud)*

---

### Tech stack

* **Containerization:** Docker & Docker Compose 
  * multi-container orchestration
  * db: postgres:15-alpine, 
  * caching: redis:7-alpine.
  * monitoring: prom/prometheus:latest
  * backend: car-auction-backend (eclipse-temurin:21-jre-alpine)
* **Hosting:** Google Cloud Platform (GCP).
* **Observability:** Prometheus (metrics scraping) & Grafana (visual dashboards).

#### Backend (`bidapi`)

* **Language & Framework:** Kotlin 2.0 (Java 21), Spring Boot 3.3.4
* **Database & ORM:** PostgreSQL 15, Spring Data JPA (Hibernate)
* **Caching & Throttling:** Redis 7, Spring Cache, Bucket4j
* **Security:** Spring Security, Custom JWT Provider
* **Real-time Bidding:** Spring Boot WebSocket
* **Cloud & Storage:** Cloudflare R2, ImageKit
* **Documentation:** Springdoc OpenAPI (Swagger UI)

#### Frontend (`bidfe`)
* 
* **Core:** React 19, TypeScript
* **Build Tool:** Vite (optimized for fast HMR and lightweight production builds)
* **State Management:** MobX & MobX State Tree.
* **Routing:** React Router v7
* **Real-time Bidding:** `@stomp/stompjs`, `sockjs-client`