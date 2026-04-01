# Cook App — backend

Backend-сервис для приложения с рецептами: регистрация и авторизация пользователей (JWT), хранение рецептов и шагов приготовления, подписки на авторов.

## Технологии

- Java 21  
- Spring Boot 3 (Web, Security, Data JPA)  
- Spring Security + JWT
- PostgreSQL 16 
- Gradle 

## Запуск приложения
### Вводим поочередно следующие программы
- docker compose up -d
- docker ps (проверяем, что наш контейнер с бд запустился)
- ./gradlew bootRun
