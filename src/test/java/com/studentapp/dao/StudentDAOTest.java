package com.studentapp.dao;

import com.studentapp.model.Student;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class StudentDAOTest {

    private StudentDAO dao;

    @BeforeEach
    void setUp() {
        dao = new StudentDAO();
    }

    @Test
    void getAllReturnsPreloadedStudents() {
        List<Student> all = dao.getAll();
        assertFalse(all.isEmpty(), "Should have pre-loaded students");
    }

    @Test
    void addStudentIncreasesCount() {
        int before = dao.getAll().size();
        Student s = new Student(0, "Test User", "test@email.com", "History", 19, 3.0);
        dao.add(s);
        assertEquals(before + 1, dao.getAll().size());
    }

    @Test
    void findByIdReturnsCorrectStudent() {
        Student added = dao.add(new Student(0, "Find Me", "find@email.com", "Art", 21, 3.3));
        Optional<Student> found = dao.findById(added.getId());
        assertTrue(found.isPresent());
        assertEquals("Find Me", found.get().getName());
    }

    @Test
    void updateChangesStudentData() {
        Student added = dao.add(new Student(0, "Original", "orig@email.com", "Math", 20, 3.0));
        added.setName("Updated");
        assertTrue(dao.update(added));
        assertEquals("Updated", dao.findById(added.getId()).get().getName());
    }

    @Test
    void deleteRemovesStudent() {
        Student added = dao.add(new Student(0, "To Delete", "del@email.com", "PE", 18, 2.5));
        int id = added.getId();
        assertTrue(dao.delete(id));
        assertFalse(dao.findById(id).isPresent());
    }

    @Test
    void searchFindsMatchingStudents() {
        dao.add(new Student(0, "Search Target", "st@email.com", "Drama", 22, 3.1));
        List<Student> results = dao.search("Search");
        assertFalse(results.isEmpty());
        assertTrue(results.stream().anyMatch(s -> s.getName().contains("Search")));
    }
}
