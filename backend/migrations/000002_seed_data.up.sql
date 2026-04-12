-- user password = password123 (bcrypt hash)
INSERT INTO users (id, name, email, password)
VALUES (
    uuid_generate_v4(),
    'Test User',
    'test@example.com',
    '$2a$12$w8Q7Z1j7sHkYQY9X1n4m3OQzQ7mV7tY9Z1l7K8X9Y7Z8Q7X1Y9Z1G'
);

-- project
INSERT INTO projects (id, name, description, owner_id)
SELECT uuid_generate_v4(), 'Demo Project', 'Sample project', id FROM users LIMIT 1;

-- tasks
INSERT INTO tasks (id, title, status, priority, project_id)
SELECT uuid_generate_v4(), 'Task 1', 'todo', 'high', id FROM projects LIMIT 1;

INSERT INTO tasks (id, title, status, priority, project_id)
SELECT uuid_generate_v4(), 'Task 2', 'in_progress', 'medium', id FROM projects LIMIT 1;

INSERT INTO tasks (id, title, status, priority, project_id)
SELECT uuid_generate_v4(), 'Task 3', 'done', 'low', id FROM projects LIMIT 1;