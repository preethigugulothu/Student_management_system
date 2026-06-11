package com.studentapp.servlet;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.studentapp.dao.StudentDAO;
import com.studentapp.model.Student;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * REST-style servlet that handles CRUD operations for Students.
 *
 * Routes:
 *   GET    /api/students          - list all
 *   GET    /api/students?id=N     - get one
 *   GET    /api/students?q=term   - search
 *   POST   /api/students          - create
 *   PUT    /api/students          - update
 *   DELETE /api/students?id=N     - delete
 */
@WebServlet("/api/students")
public class StudentServlet extends HttpServlet {

    private final StudentDAO dao = new StudentDAO();
    private final Gson gson = new GsonBuilder().setPrettyPrinting().create();

    // ------------------------------------------------------------------ GET
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        setJsonResponse(resp);
        PrintWriter out = resp.getWriter();

        String id  = req.getParameter("id");
        String query = req.getParameter("q");

        if (id != null) {
            // GET by id
            Optional<Student> student = dao.findById(Integer.parseInt(id));
            if (student.isPresent()) {
                out.print(gson.toJson(student.get()));
            } else {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.print(gson.toJson(error("Student not found")));
            }
        } else if (query != null && !query.isBlank()) {
            // Search
            List<Student> results = dao.search(query);
            out.print(gson.toJson(results));
        } else {
            // GET all
            out.print(gson.toJson(dao.getAll()));
        }
    }

    // ----------------------------------------------------------------- POST
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        setJsonResponse(resp);
        PrintWriter out = resp.getWriter();

        Student student = gson.fromJson(req.getReader(), Student.class);
        if (student == null || student.getName() == null || student.getName().isBlank()) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print(gson.toJson(error("Student name is required")));
            return;
        }

        Student created = dao.add(student);
        resp.setStatus(HttpServletResponse.SC_CREATED);
        out.print(gson.toJson(created));
    }

    // ------------------------------------------------------------------ PUT
    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        setJsonResponse(resp);
        PrintWriter out = resp.getWriter();

        Student student = gson.fromJson(req.getReader(), Student.class);
        if (student == null || student.getId() <= 0) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print(gson.toJson(error("Valid student id is required")));
            return;
        }

        if (dao.update(student)) {
            out.print(gson.toJson(student));
        } else {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
            out.print(gson.toJson(error("Student not found")));
        }
    }

    // --------------------------------------------------------------- DELETE
    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        setJsonResponse(resp);
        PrintWriter out = resp.getWriter();

        String id = req.getParameter("id");
        if (id == null) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print(gson.toJson(error("id parameter is required")));
            return;
        }

        if (dao.delete(Integer.parseInt(id))) {
            out.print(gson.toJson(message("Student deleted successfully")));
        } else {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
            out.print(gson.toJson(error("Student not found")));
        }
    }

    // ------------------------------------------------------------ Helpers
    private void setJsonResponse(HttpServletResponse resp) {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        resp.setHeader("Access-Control-Allow-Origin", "*");
    }

    private Map<String, String> error(String msg) {
        Map<String, String> m = new HashMap<>();
        m.put("error", msg);
        return m;
    }

    private Map<String, String> message(String msg) {
        Map<String, String> m = new HashMap<>();
        m.put("message", msg);
        return m;
    }
}
