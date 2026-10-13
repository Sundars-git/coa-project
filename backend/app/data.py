"""
In-memory sample data: exams, questions, and answer keys.
Submissions and results are persisted in SQLite (see database.py).
"""

from datetime import datetime, timezone, timedelta

# ---------------------------------------------------------------------------
# Sample Exams & Questions
# ---------------------------------------------------------------------------

SAMPLE_EXAMS = [
    {
        "id": "exam-001",
        "title": "Computer Networks Fundamentals",
        "subject": "Computer Science",
        "description": (
            "This examination covers fundamental concepts of computer networking "
            "including OSI model, TCP/IP, routing protocols, and network security basics."
        ),
        "duration_minutes": 30,
        "total_marks": 10,
        "pass_mark": 6,
        "scheduled_at": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(),
        "status": "active",
        "created_by": "usr-admin-001",
    },
    {
        "id": "exam-002",
        "title": "Data Structures & Algorithms",
        "subject": "Computer Science",
        "description": (
            "A comprehensive test on arrays, linked lists, trees, graphs, "
            "sorting algorithms, and time complexity analysis."
        ),
        "duration_minutes": 45,
        "total_marks": 10,
        "pass_mark": 6,
        "scheduled_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
        "status": "active",
        "created_by": "usr-admin-001",
    },
    {
        "id": "exam-003",
        "title": "Database Management Systems",
        "subject": "Information Technology",
        "description": (
            "Covers relational database concepts, SQL queries, normalization, "
            "transactions, and database design principles."
        ),
        "duration_minutes": 40,
        "total_marks": 10,
        "pass_mark": 6,
        "scheduled_at": (datetime.now(timezone.utc) + timedelta(days=3)).isoformat(),
        "status": "active",
        "created_by": "usr-admin-001",
    },
    {
        "id": "exam-004",
        "title": "Operating Systems Concepts",
        "subject": "Computer Science",
        "description": (
            "Examination on process management, memory management, file systems, "
            "and concurrency control in modern operating systems."
        ),
        "duration_minutes": 35,
        "total_marks": 10,
        "pass_mark": 6,
        "scheduled_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "status": "draft",
        "created_by": "usr-admin-001",
    },
]

# Questions keyed by exam_id. correct_option never leaves the backend.
SAMPLE_QUESTIONS = {
    "exam-001": [
        {
            "id": "q-001-01", "exam_id": "exam-001", "order_index": 1, "marks": 1,
            "question_text": "Which layer of the OSI model is responsible for end-to-end communication and error recovery?",
            "option_a": "Network Layer",
            "option_b": "Data Link Layer",
            "option_c": "Transport Layer",
            "option_d": "Session Layer",
            "correct_option": "c",
        },
        {
            "id": "q-001-02", "exam_id": "exam-001", "order_index": 2, "marks": 1,
            "question_text": "What does TCP stand for?",
            "option_a": "Transfer Control Protocol",
            "option_b": "Transmission Control Protocol",
            "option_c": "Transport Communication Protocol",
            "option_d": "Terminal Control Protocol",
            "correct_option": "b",
        },
        {
            "id": "q-001-03", "exam_id": "exam-001", "order_index": 3, "marks": 1,
            "question_text": "Which IP address range belongs to Class C private addresses?",
            "option_a": "10.0.0.0 – 10.255.255.255",
            "option_b": "172.16.0.0 – 172.31.255.255",
            "option_c": "192.168.0.0 – 192.168.255.255",
            "option_d": "127.0.0.0 – 127.255.255.255",
            "correct_option": "c",
        },
        {
            "id": "q-001-04", "exam_id": "exam-001", "order_index": 4, "marks": 1,
            "question_text": "What is the maximum transmission unit (MTU) of a standard Ethernet frame?",
            "option_a": "512 bytes",
            "option_b": "1024 bytes",
            "option_c": "1500 bytes",
            "option_d": "2048 bytes",
            "correct_option": "c",
        },
        {
            "id": "q-001-05", "exam_id": "exam-001", "order_index": 5, "marks": 1,
            "question_text": "Which protocol is used to resolve IP addresses to MAC addresses?",
            "option_a": "DNS",
            "option_b": "DHCP",
            "option_c": "RARP",
            "option_d": "ARP",
            "correct_option": "d",
        },
        {
            "id": "q-001-06", "exam_id": "exam-001", "order_index": 6, "marks": 1,
            "question_text": "UDP differs from TCP primarily because UDP is:",
            "option_a": "Connection-oriented and reliable",
            "option_b": "Connectionless and unreliable",
            "option_c": "Slower but more secure",
            "option_d": "Used only for file transfers",
            "correct_option": "b",
        },
        {
            "id": "q-001-07", "exam_id": "exam-001", "order_index": 7, "marks": 1,
            "question_text": "What is the default port number for HTTPS?",
            "option_a": "80",
            "option_b": "8080",
            "option_c": "443",
            "option_d": "8443",
            "correct_option": "c",
        },
        {
            "id": "q-001-08", "exam_id": "exam-001", "order_index": 8, "marks": 1,
            "question_text": "Which routing protocol uses the Bellman-Ford algorithm?",
            "option_a": "OSPF",
            "option_b": "BGP",
            "option_c": "RIP",
            "option_d": "EIGRP",
            "correct_option": "c",
        },
        {
            "id": "q-001-09", "exam_id": "exam-001", "order_index": 9, "marks": 1,
            "question_text": "In a three-way handshake, what is the correct sequence?",
            "option_a": "SYN → ACK → SYN-ACK",
            "option_b": "SYN → SYN-ACK → ACK",
            "option_c": "ACK → SYN → SYN-ACK",
            "option_d": "SYN-ACK → SYN → ACK",
            "correct_option": "b",
        },
        {
            "id": "q-001-10", "exam_id": "exam-001", "order_index": 10, "marks": 1,
            "question_text": "Which device operates at Layer 3 of the OSI model?",
            "option_a": "Hub",
            "option_b": "Switch",
            "option_c": "Router",
            "option_d": "Repeater",
            "correct_option": "c",
        },
    ],
    "exam-002": [
        {
            "id": "q-002-01", "exam_id": "exam-002", "order_index": 1, "marks": 1,
            "question_text": "What is the time complexity of binary search on a sorted array of n elements?",
            "option_a": "O(n)",
            "option_b": "O(n²)",
            "option_c": "O(log n)",
            "option_d": "O(n log n)",
            "correct_option": "c",
        },
        {
            "id": "q-002-02", "exam_id": "exam-002", "order_index": 2, "marks": 1,
            "question_text": "Which data structure uses LIFO (Last In, First Out) ordering?",
            "option_a": "Queue",
            "option_b": "Stack",
            "option_c": "Heap",
            "option_d": "Deque",
            "correct_option": "b",
        },
        {
            "id": "q-002-03", "exam_id": "exam-002", "order_index": 3, "marks": 1,
            "question_text": "In a Binary Search Tree, where is the smallest element located?",
            "option_a": "Root",
            "option_b": "Rightmost node",
            "option_c": "Leftmost node",
            "option_d": "Last level",
            "correct_option": "c",
        },
        {
            "id": "q-002-04", "exam_id": "exam-002", "order_index": 4, "marks": 1,
            "question_text": "Which sorting algorithm has the best average-case time complexity?",
            "option_a": "Bubble Sort",
            "option_b": "Insertion Sort",
            "option_c": "Merge Sort",
            "option_d": "Selection Sort",
            "correct_option": "c",
        },
        {
            "id": "q-002-05", "exam_id": "exam-002", "order_index": 5, "marks": 1,
            "question_text": "What is the space complexity of a recursive depth-first search on a graph with V vertices?",
            "option_a": "O(1)",
            "option_b": "O(V)",
            "option_c": "O(V²)",
            "option_d": "O(E)",
            "correct_option": "b",
        },
        {
            "id": "q-002-06", "exam_id": "exam-002", "order_index": 6, "marks": 1,
            "question_text": "A hash table has O(1) average time for lookups. What causes worst-case O(n)?",
            "option_a": "Large table size",
            "option_b": "Hash collisions",
            "option_c": "Sorted keys",
            "option_d": "Integer keys only",
            "correct_option": "b",
        },
        {
            "id": "q-002-07", "exam_id": "exam-002", "order_index": 7, "marks": 1,
            "question_text": "Which traversal visits nodes in Left → Root → Right order?",
            "option_a": "Pre-order",
            "option_b": "Post-order",
            "option_c": "In-order",
            "option_d": "Level-order",
            "correct_option": "c",
        },
        {
            "id": "q-002-08", "exam_id": "exam-002", "order_index": 8, "marks": 1,
            "question_text": "Dijkstra's algorithm is used for:",
            "option_a": "Sorting vertices",
            "option_b": "Finding shortest paths in a weighted graph",
            "option_c": "Detecting cycles in a directed graph",
            "option_d": "Topological sorting",
            "correct_option": "b",
        },
        {
            "id": "q-002-09", "exam_id": "exam-002", "order_index": 9, "marks": 1,
            "question_text": "Which data structure is best suited for implementing a priority queue?",
            "option_a": "Array",
            "option_b": "Linked List",
            "option_c": "Heap",
            "option_d": "Stack",
            "correct_option": "c",
        },
        {
            "id": "q-002-10", "exam_id": "exam-002", "order_index": 10, "marks": 1,
            "question_text": "Quick sort's worst-case time complexity is O(n²). When does this occur?",
            "option_a": "When the array is random",
            "option_b": "When the pivot is always the median",
            "option_c": "When the array is already sorted (with naive pivot)",
            "option_d": "When the array has all duplicate elements",
            "correct_option": "c",
        },
    ],
    "exam-003": [
        {
            "id": "q-003-01", "exam_id": "exam-003", "order_index": 1, "marks": 1,
            "question_text": "What does ACID stand for in database transactions?",
            "option_a": "Atomicity, Consistency, Isolation, Durability",
            "option_b": "Accuracy, Consistency, Integrity, Durability",
            "option_c": "Atomicity, Concurrency, Isolation, Data",
            "option_d": "Availability, Consistency, Isolation, Durability",
            "correct_option": "a",
        },
        {
            "id": "q-003-02", "exam_id": "exam-003", "order_index": 2, "marks": 1,
            "question_text": "Which SQL command is used to remove all rows from a table without logging individual deletions?",
            "option_a": "DELETE",
            "option_b": "DROP",
            "option_c": "TRUNCATE",
            "option_d": "REMOVE",
            "correct_option": "c",
        },
        {
            "id": "q-003-03", "exam_id": "exam-003", "order_index": 3, "marks": 1,
            "question_text": "Which normal form requires that every non-prime attribute is fully functionally dependent on every candidate key?",
            "option_a": "1NF",
            "option_b": "2NF",
            "option_c": "3NF",
            "option_d": "BCNF",
            "correct_option": "b",
        },
        {
            "id": "q-003-04", "exam_id": "exam-003", "order_index": 4, "marks": 1,
            "question_text": "What type of JOIN returns all rows from both tables, with NULLs where there is no match?",
            "option_a": "INNER JOIN",
            "option_b": "LEFT JOIN",
            "option_c": "RIGHT JOIN",
            "option_d": "FULL OUTER JOIN",
            "correct_option": "d",
        },
        {
            "id": "q-003-05", "exam_id": "exam-003", "order_index": 5, "marks": 1,
            "question_text": "Which SQL aggregate function returns the number of rows matching a condition?",
            "option_a": "SUM()",
            "option_b": "COUNT()",
            "option_c": "AVG()",
            "option_d": "MAX()",
            "correct_option": "b",
        },
        {
            "id": "q-003-06", "exam_id": "exam-003", "order_index": 6, "marks": 1,
            "question_text": "A foreign key constraint ensures:",
            "option_a": "Unique values in the referenced column",
            "option_b": "Referential integrity between two tables",
            "option_c": "No NULL values in the column",
            "option_d": "Faster query execution",
            "correct_option": "b",
        },
        {
            "id": "q-003-07", "exam_id": "exam-003", "order_index": 7, "marks": 1,
            "question_text": "What is a deadlock in database systems?",
            "option_a": "When a query takes too long to execute",
            "option_b": "When two or more transactions wait for each other's locks indefinitely",
            "option_c": "When a database connection pool is exhausted",
            "option_d": "When an index becomes fragmented",
            "correct_option": "b",
        },
        {
            "id": "q-003-08", "exam_id": "exam-003", "order_index": 8, "marks": 1,
            "question_text": "Which statement about a VIEW in SQL is correct?",
            "option_a": "A view stores data permanently on disk",
            "option_b": "A view is a virtual table based on a SELECT query",
            "option_c": "A view cannot be queried with JOIN",
            "option_d": "A view improves write performance",
            "correct_option": "b",
        },
        {
            "id": "q-003-09", "exam_id": "exam-003", "order_index": 9, "marks": 1,
            "question_text": "What does the GROUP BY clause do in SQL?",
            "option_a": "Sorts the result set",
            "option_b": "Filters rows before aggregation",
            "option_c": "Groups rows with the same values for aggregate functions",
            "option_d": "Joins multiple tables",
            "correct_option": "c",
        },
        {
            "id": "q-003-10", "exam_id": "exam-003", "order_index": 10, "marks": 1,
            "question_text": "Which isolation level prevents dirty reads but allows non-repeatable reads?",
            "option_a": "READ UNCOMMITTED",
            "option_b": "READ COMMITTED",
            "option_c": "REPEATABLE READ",
            "option_d": "SERIALIZABLE",
            "correct_option": "b",
        },
    ],
    "exam-004": [
        {
            "id": "q-004-01", "exam_id": "exam-004", "order_index": 1, "marks": 1,
            "question_text": "Which scheduling algorithm gives the shortest average waiting time for a given set of processes?",
            "option_a": "First Come First Served (FCFS)",
            "option_b": "Round Robin",
            "option_c": "Shortest Job First (SJF)",
            "option_d": "Priority Scheduling",
            "correct_option": "c",
        },
        {
            "id": "q-004-02", "exam_id": "exam-004", "order_index": 2, "marks": 1,
            "question_text": "What is a race condition?",
            "option_a": "A condition where two processes compete for CPU time",
            "option_b": "An outcome that depends on the non-deterministic ordering of events",
            "option_c": "A deadlock between two threads",
            "option_d": "A process that uses all available memory",
            "correct_option": "b",
        },
        {
            "id": "q-004-03", "exam_id": "exam-004", "order_index": 3, "marks": 1,
            "question_text": "Which page-replacement algorithm replaces the page that will not be used for the longest time?",
            "option_a": "LRU",
            "option_b": "FIFO",
            "option_c": "OPT (Optimal)",
            "option_d": "Clock",
            "correct_option": "c",
        },
        {
            "id": "q-004-04", "exam_id": "exam-004", "order_index": 4, "marks": 1,
            "question_text": "What is the purpose of a semaphore?",
            "option_a": "To allocate memory dynamically",
            "option_b": "To synchronize access to shared resources",
            "option_c": "To schedule processes on the CPU",
            "option_d": "To manage file system permissions",
            "correct_option": "b",
        },
        {
            "id": "q-004-05", "exam_id": "exam-004", "order_index": 5, "marks": 1,
            "question_text": "In virtual memory, what is thrashing?",
            "option_a": "Excessive CPU usage by a single process",
            "option_b": "Constant page faults causing more time in paging than executing",
            "option_c": "Memory fragmentation due to dynamic allocation",
            "option_d": "Cache miss causing slow memory access",
            "correct_option": "b",
        },
        {
            "id": "q-004-06", "exam_id": "exam-004", "order_index": 6, "marks": 1,
            "question_text": "Which of the following is NOT a condition for deadlock (Coffman conditions)?",
            "option_a": "Mutual Exclusion",
            "option_b": "Preemption",
            "option_c": "Hold and Wait",
            "option_d": "Circular Wait",
            "correct_option": "b",
        },
        {
            "id": "q-004-07", "exam_id": "exam-004", "order_index": 7, "marks": 1,
            "question_text": "What is the difference between a process and a thread?",
            "option_a": "Threads have their own memory space; processes share memory",
            "option_b": "Processes have their own memory space; threads share memory within a process",
            "option_c": "Threads are heavier weight than processes",
            "option_d": "Processes cannot communicate with each other",
            "correct_option": "b",
        },
        {
            "id": "q-004-08", "exam_id": "exam-004", "order_index": 8, "marks": 1,
            "question_text": "Which file allocation method is best for sequential access?",
            "option_a": "Indexed allocation",
            "option_b": "Linked allocation",
            "option_c": "Contiguous allocation",
            "option_d": "Hash-based allocation",
            "correct_option": "c",
        },
        {
            "id": "q-004-09", "exam_id": "exam-004", "order_index": 9, "marks": 1,
            "question_text": "What does TLB stand for in memory management?",
            "option_a": "Table Lookup Buffer",
            "option_b": "Translation Lookaside Buffer",
            "option_c": "Transfer Layer Block",
            "option_d": "Thread Level Buffer",
            "correct_option": "b",
        },
        {
            "id": "q-004-10", "exam_id": "exam-004", "order_index": 10, "marks": 1,
            "question_text": "Which IPC mechanism allows processes to share a region of memory directly?",
            "option_a": "Pipes",
            "option_b": "Message Queues",
            "option_c": "Shared Memory",
            "option_d": "Sockets",
            "correct_option": "c",
        },
    ],
}


def get_all_exams():
    return list(SAMPLE_EXAMS)


def get_exam_by_id(exam_id: str):
    for exam in SAMPLE_EXAMS:
        if exam["id"] == exam_id:
            return exam
    return None


def get_questions_for_exam(exam_id: str, include_correct: bool = False):
    questions = SAMPLE_QUESTIONS.get(exam_id, [])
    if include_correct:
        return questions
    # Strip correct_option before sending to student
    return [{k: v for k, v in q.items() if k != "correct_option"} for q in questions]


def get_question_by_id(question_id: str):
    for questions in SAMPLE_QUESTIONS.values():
        for q in questions:
            if q["id"] == question_id:
                return q
    return None
