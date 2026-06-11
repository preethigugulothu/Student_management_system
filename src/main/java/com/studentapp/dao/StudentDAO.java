package com.studentapp.dao;

import com.studentapp.model.Student;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * In-memory data access layer for Students.
 * In a real application this would connect to a database.
 */
public class StudentDAO {

    private static final List<Student> students = new ArrayList<>();
    private static final AtomicInteger idCounter = new AtomicInteger(1);

    // Pre-populate with sample data
    static {
        students.add(new Student(idCounter.getAndIncrement(), "Alice Johnson",  "alice@email.com",  "Computer Science", 20, 3.8));
        students.add(new Student(idCounter.getAndIncrement(), "Bob Martinez",   "bob@email.com",    "Mathematics",       22, 3.5));
        students.add(new Student(idCounter.getAndIncrement(), "Clara Nguyen",   "clara@email.com",  "Physics",           21, 3.9));
        students.add(new Student(idCounter.getAndIncrement(), "David Kim",      "david@email.com",  "Engineering",       23, 3.2));
        students.add(new Student(idCounter.getAndIncrement(), "Eva Brown",      "eva@email.com",    "Biology",           20, 3.7));
    }

    /** Return all students. */
    public List<Student> getAll() {
        return new ArrayList<>(students);
    }

    /** Find a student by id. */
    public Optional<Student> findById(int id) {
        return students.stream().filter(s -> s.getId() == id).findFirst();
    }

    /** Add a new student. */
    public Student add(Student student) {
        student.setId(idCounter.getAndIncrement());
        students.add(student);
        return student;
    }

    /** Update an existing student. Returns true if found and updated. */
    public boolean update(Student updated) {
        for (int i = 0; i < students.size(); i++) {
            if (students.get(i).getId() == updated.getId()) {
                students.set(i, updated);
                return true;
            }
        }
        return false;
    }

    /** Delete a student by id. Returns true if found and removed. */
    public boolean delete(int id) {
        return students.removeIf(s -> s.getId() == id);
    }

    /** Search students by name (case-insensitive). */
    public List<Student> search(String query) {
        String lower = query.toLowerCase();
        List<Student> results = new ArrayList<>();
        for (Student s : students) {
            if (s.getName().toLowerCase().contains(lower) ||
                s.getCourse().toLowerCase().contains(lower)) {
                results.add(s);
            }
        }
        return results;
    }
}
