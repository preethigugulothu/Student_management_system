# Student Management System

A simple full-stack Java web application demonstrating:

- **Java** — Servlet-based REST API, DAO pattern, model classes, unit tests (JUnit 5)
- **HTML5** — Semantic markup, accessible forms, modal dialog
- **CSS3** — Custom properties, Grid, Flexbox, animations, transitions, gradients, backdrop-filter
- **JavaScript (ES6+)** — Async/await, modules pattern, client-side validation, dynamic DOM rendering

---

## Project Structure

```
student-management/
├── pom.xml                              Maven build file
├── src/
│   ├── main/
│   │   ├── java/com/studentapp/
│   │   │   ├── model/Student.java       Entity
│   │   │   ├── dao/StudentDAO.java      In-memory data layer
│   │   │   ├── servlet/StudentServlet.java  REST servlet
│   │   │   └── util/AppConstants.java  
│   │   └── webapp/
│   │       ├── index.html               Single-page UI
│   │       ├── css/style.css            CSS3 styles
│   │       ├── js/
│   │       │   ├── api.js               API + demo data layer
│   │       │   └── app.js               App logic & rendering
│   │       └── WEB-INF/web.xml
│   └── test/
│       └── java/com/studentapp/
│           └── dao/StudentDAOTest.java  Unit tests
```

---

## Features

| Feature | Description |
|---------|-------------|
| Dashboard | Stats (total, avg GPA, top GPA, courses) + bar chart |
| Students list | Card grid with search/filter |
| Add/Edit | Validated form with inline errors |
| Delete | Confirmation modal |
| Responsive | Works on mobile, tablet, desktop |
| Demo mode | Runs purely in-browser without a backend |

---

## Running the App

### Option 1 — Open directly in browser (demo mode)

Just open `src/main/webapp/index.html` in your browser.  
All data is stored in-memory in the browser. No server needed.

### Option 2 — Deploy to Tomcat (full backend)

**Prerequisites:** Java 11+, Maven 3.6+, Apache Tomcat 10+

```bash
# Build
mvn clean package

# Deploy the generated WAR
cp target/student-management-1.0.0.war $TOMCAT_HOME/webapps/ROOT.war

# Start Tomcat
$TOMCAT_HOME/bin/startup.sh
```

Then open: http://localhost:8080

> To switch from demo mode to live backend, open `js/api.js` and set `USE_DEMO = false`.

### Run tests

```bash
mvn test
```

---

## REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students` | List all students |
| GET | `/api/students?id=N` | Get student by id |
| GET | `/api/students?q=term` | Search by name/course |
| POST | `/api/students` | Create student |
| PUT | `/api/students` | Update student |
| DELETE | `/api/students?id=N` | Delete student |
