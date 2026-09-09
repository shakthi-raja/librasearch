/**
 * The curated catalogue: real textbooks a campus library holds, with real
 * ISBN-13s for each edition. Descriptions and chapter summaries are written
 * for LibraSearch in our own words; they are what semantic search runs over,
 * so each says what the chapter teaches in the language a syllabus would use.
 *
 * Chapter page ranges are not published per chapter, so the seed spreads an
 * edition's pages evenly over its chapter count (see seed README).
 */

export type CategorySeed = { slug: string; name: string; parent?: string; description?: string };

export type ChapterSeed = { no: number; title: string; summary: string };

export type EditionSeed = {
  isbn13: string;
  editionNo: number;
  publisher: string;
  year: number;
  pages: number;
  format?: "HARDCOVER" | "PAPERBACK";
  /** Total chapters in the printed edition, used to estimate page ranges. */
  totalChapters: number;
  chapters: ChapterSeed[];
};

export type BookSeed = {
  title: string;
  subtitle?: string;
  authors: string[];
  category: string;
  /** Home rack on the stack map, matches copies.rack_code. */
  rack: string;
  description: string;
  editions: EditionSeed[];
  tags?: string[];
};

export const PUBLISHERS: { name: string; city: string; website?: string }[] = [
  { name: "McGraw-Hill Education", city: "New York", website: "https://www.mheducation.com" },
  { name: "Pearson", city: "London", website: "https://www.pearson.com" },
  { name: "MIT Press", city: "Cambridge, MA", website: "https://mitpress.mit.edu" },
  { name: "Wiley", city: "Hoboken", website: "https://www.wiley.com" },
  { name: "O'Reilly Media", city: "Sebastopol", website: "https://www.oreilly.com" },
  { name: "Morgan Kaufmann", city: "Cambridge, MA" },
  { name: "Cambridge University Press", city: "Cambridge", website: "https://www.cambridge.org" },
  { name: "Springer", city: "New York", website: "https://www.springer.com" },
  { name: "Cengage Learning", city: "Boston", website: "https://www.cengage.com" },
  { name: "Oxford University Press", city: "New York", website: "https://global.oup.com" },
  { name: "Prentice Hall", city: "Upper Saddle River" },
  { name: "Addison-Wesley", city: "Boston" },
  { name: "Wellesley-Cambridge Press", city: "Wellesley" },
  { name: "CreateSpace", city: "Scotts Valley" },
];

export const CATEGORIES: CategorySeed[] = [
  { slug: "computer-science", name: "Computer science" },
  { slug: "databases", name: "Databases", parent: "computer-science" },
  { slug: "algorithms", name: "Algorithms and data structures", parent: "computer-science" },
  { slug: "operating-systems", name: "Operating systems", parent: "computer-science" },
  { slug: "networks", name: "Computer networks", parent: "computer-science" },
  { slug: "architecture", name: "Computer architecture", parent: "computer-science" },
  { slug: "languages", name: "Programming languages and compilers", parent: "computer-science" },
  { slug: "software-engineering", name: "Software engineering", parent: "computer-science" },
  { slug: "artificial-intelligence", name: "Artificial intelligence", parent: "computer-science" },
  { slug: "machine-learning", name: "Machine learning", parent: "artificial-intelligence" },
  { slug: "information-retrieval", name: "Information retrieval", parent: "computer-science" },
  { slug: "theory-of-computation", name: "Theory of computation", parent: "computer-science" },
  { slug: "security", name: "Security and cryptography", parent: "computer-science" },
  { slug: "electronics", name: "Electronics" },
  { slug: "analog-circuits", name: "Analog circuits", parent: "electronics" },
  { slug: "digital-design", name: "Digital design", parent: "electronics" },
  { slug: "signals-communication", name: "Signals and communication", parent: "electronics" },
  { slug: "electrical", name: "Electrical engineering" },
  { slug: "circuit-analysis", name: "Circuit analysis", parent: "electrical" },
  { slug: "machines-power", name: "Machines and power systems", parent: "electrical" },
  { slug: "mechanical", name: "Mechanical engineering" },
  { slug: "mechanics-design", name: "Mechanics and machine design", parent: "mechanical" },
  { slug: "thermal-sciences", name: "Thermal sciences", parent: "mechanical" },
  { slug: "mathematics", name: "Mathematics" },
  { slug: "linear-algebra", name: "Linear algebra", parent: "mathematics" },
  { slug: "discrete-mathematics", name: "Discrete mathematics", parent: "mathematics" },
  { slug: "probability-statistics", name: "Probability and statistics", parent: "mathematics" },
  { slug: "engineering-mathematics", name: "Engineering mathematics", parent: "mathematics" },
  { slug: "management", name: "Management" },
  { slug: "marketing", name: "Marketing", parent: "management" },
  { slug: "organisation", name: "Organisation and leadership", parent: "management" },
];

const ch = (no: number, title: string, summary: string): ChapterSeed => ({ no, title, summary });

export const BOOKS: BookSeed[] = [
  // Databases
  {
    title: "Database System Concepts",
    authors: ["Abraham Silberschatz", "Henry F. Korth", "S. Sudarshan"],
    category: "databases",
    rack: "CS-04",
    tags: ["sql", "normalisation", "transactions"],
    description:
      "The standard first course in databases: the relational model, SQL, database design, storage and indexing, query processing and transactions, with a systems view of how a database engine works.",
    editions: [
      {
        isbn13: "9780073523323",
        editionNo: 6,
        publisher: "McGraw-Hill Education",
        year: 2011,
        pages: 1376,
        format: "HARDCOVER",
        totalChapters: 26,
        chapters: [
          ch(
            2,
            "Introduction to the Relational Model",
            "Relations, schemas and keys, foreign keys and schema diagrams, and the relational query languages that operate on tables of tuples.",
          ),
          ch(
            3,
            "Introduction to SQL",
            "Data definition and basic queries in SQL: select, from and where clauses, set operations, null values, aggregate functions and nested subqueries.",
          ),
          ch(
            7,
            "Database Design and the E-R Model",
            "Modelling an enterprise with entity sets, relationship sets, attributes and mapping cardinalities, then reducing an entity-relationship diagram to relation schemas.",
          ),
          ch(
            8,
            "Relational Database Design",
            "Why some schemas repeat data, functional dependencies, Boyce-Codd and third normal form, and decomposition algorithms that preserve dependencies and join losslessly.",
          ),
          ch(
            11,
            "Indexing and Hashing",
            "Ordered indices, B+ tree index files, static and dynamic hashing, and how an index speeds up lookups and range queries on large tables.",
          ),
          ch(
            15,
            "Concurrency Control",
            "Lock-based protocols, two-phase locking, deadlock handling, timestamp ordering and multiversion schemes that keep concurrent transactions serializable.",
          ),
        ],
      },
      {
        isbn13: "9780078022159",
        editionNo: 7,
        publisher: "McGraw-Hill Education",
        year: 2019,
        pages: 1376,
        format: "HARDCOVER",
        totalChapters: 32,
        chapters: [
          ch(
            1,
            "Introduction",
            "What a database system is for, the problems of keeping data in plain files, data abstraction and models, database languages and the architecture of a database engine.",
          ),
          ch(
            2,
            "Introduction to the Relational Model",
            "Tables as relations, attributes and domains, superkeys, candidate and primary keys, foreign key constraints, schema diagrams and the relational algebra.",
          ),
          ch(
            3,
            "Introduction to SQL",
            "Writing SQL queries: creating tables, selecting, filtering and joining rows, ordering results, handling nulls, aggregation with group by and having, and nested subqueries.",
          ),
          ch(
            4,
            "Intermediate SQL",
            "Join expressions and outer joins, views, transactions, integrity constraints such as check, unique and referential integrity, data types, indexes and authorization with grant and revoke.",
          ),
          ch(
            5,
            "Advanced SQL",
            "Calling SQL from programs, stored functions and procedures, triggers, recursive queries with common table expressions, and advanced aggregation such as ranking and windowing.",
          ),
          ch(
            6,
            "Database Design Using the E-R Model",
            "The entity-relationship model for designing a schema: entity and relationship sets, cardinality and participation, weak entity sets, generalisation, and translating a diagram into tables.",
          ),
          ch(
            7,
            "Relational Database Design",
            "How bad designs repeat data and cause update anomalies, functional dependencies, closure of attribute sets, normal forms from first to Boyce-Codd, and lossless, dependency-preserving decomposition.",
          ),
          ch(
            14,
            "Indexing",
            "Ordered indices, B+ trees and their insertion and deletion, hash indices, multiple-key access, bitmap indices and write-optimised index structures.",
          ),
          ch(
            15,
            "Query Processing",
            "How a query is evaluated: cost measures, selection, sorting, the join algorithms nested loop, merge and hash join, and evaluation of whole expressions.",
          ),
          ch(
            16,
            "Query Optimization",
            "Transforming relational expressions, estimating the size of intermediate results, choosing join orders and evaluation plans, and materialised views.",
          ),
          ch(
            17,
            "Transactions",
            "The transaction concept and the ACID properties, schedules, conflict and view serializability, recoverable schedules and isolation levels in SQL.",
          ),
          ch(
            18,
            "Concurrency Control",
            "Locking protocols and two-phase locking, deadlock prevention and detection, multiple granularity, timestamp ordering, validation and snapshot isolation.",
          ),
          ch(
            19,
            "Recovery System",
            "Failure classification, log-based recovery, checkpoints, buffer management, the ARIES algorithm and making committed transactions durable after a crash.",
          ),
        ],
      },
    ],
  },
  {
    title: "Fundamentals of Database Systems",
    authors: ["Ramez Elmasri", "Shamkant B. Navathe"],
    category: "databases",
    rack: "CS-04",
    tags: ["sql", "normalisation"],
    description:
      "A broad, design-centred database text covering conceptual modelling, the relational model and SQL, normalisation theory, file organisation and indexing, and transaction processing.",
    editions: [
      {
        isbn13: "9780136086208",
        editionNo: 6,
        publisher: "Addison-Wesley",
        year: 2011,
        pages: 1172,
        totalChapters: 30,
        chapters: [
          ch(
            15,
            "Basics of Functional Dependencies and Normalization for Relational Databases",
            "Informal design guidelines for relation schemas, functional dependencies, and first, second, third and Boyce-Codd normal forms with worked decompositions.",
          ),
        ],
      },
      {
        isbn13: "9780133970777",
        editionNo: 7,
        publisher: "Pearson",
        year: 2015,
        pages: 1280,
        totalChapters: 30,
        chapters: [
          ch(
            1,
            "Databases and Database Users",
            "What a database is, the people who design, use and administer one, and the advantages of the database approach over application-managed files.",
          ),
          ch(
            3,
            "Data Modeling Using the Entity-Relationship (ER) Model",
            "Conceptual design with entity types, attributes, keys, relationship types, structural constraints and weak entities, using a company database as the running example.",
          ),
          ch(
            5,
            "The Relational Data Model and Relational Database Constraints",
            "Domains, tuples and relations, key constraints, entity integrity and referential integrity, and how inserts, deletes and updates can violate them.",
          ),
          ch(
            6,
            "Basic SQL",
            "SQL data definition, specifying constraints, and basic retrieval queries with select-from-where, aliasing, set operations and pattern matching.",
          ),
          ch(
            8,
            "The Relational Algebra and Relational Calculus",
            "Select, project, rename, set operations, joins and division in relational algebra, and the tuple and domain relational calculus.",
          ),
          ch(
            14,
            "Basics of Functional Dependencies and Normalization for Relational Databases",
            "Design guidelines that avoid redundancy and update anomalies, functional dependencies, and normalisation into first, second, third and Boyce-Codd normal form.",
          ),
          ch(
            15,
            "Relational Database Design Algorithms and Further Dependencies",
            "Inference rules and closures, minimal covers, synthesis and decomposition algorithms, multivalued dependencies and fourth normal form, join dependencies and fifth normal form.",
          ),
          ch(
            17,
            "Indexing Structures for Files and Physical Database Design",
            "Primary, clustering and secondary indexes, multilevel indexes, B-trees and B+ trees, and choosing indexes during physical design.",
          ),
          ch(
            20,
            "Introduction to Transaction Processing Concepts and Theory",
            "Why concurrency control and recovery are needed, transaction states, the ACID properties, schedules and serializability.",
          ),
          ch(
            21,
            "Concurrency Control Techniques",
            "Two-phase locking, deadlock and starvation, timestamp ordering, multiversion and validation techniques, and lock granularity.",
          ),
        ],
      },
    ],
  },
  {
    title: "Database Management Systems",
    authors: ["Raghu Ramakrishnan", "Johannes Gehrke"],
    category: "databases",
    rack: "CS-04",
    description:
      "A systems-oriented database text that pairs SQL and design with how storage managers, index structures, query evaluators and transaction managers are built.",
    editions: [
      {
        isbn13: "9780072465631",
        editionNo: 3,
        publisher: "McGraw-Hill Education",
        year: 2002,
        pages: 1104,
        totalChapters: 28,
        chapters: [
          ch(
            1,
            "Overview of Database Systems",
            "Why store data in a DBMS, levels of abstraction and data independence, queries, concurrency and recovery, and the structure of a database system.",
          ),
          ch(
            2,
            "Introduction to Database Design",
            "The stages of design and the ER model: entities, relationships, key and participation constraints, weak entities, class hierarchies and aggregation.",
          ),
          ch(
            3,
            "The Relational Model",
            "Creating and modifying relations, integrity constraints and their enforcement, querying relational data, logical design from ER diagrams, and views.",
          ),
          ch(
            4,
            "Relational Algebra and Calculus",
            "Selection, projection, set operations, renaming, joins and division, with tuple and domain relational calculus and their expressive power.",
          ),
          ch(
            5,
            "SQL: Queries, Constraints, Triggers",
            "The form of an SQL query, union and intersection, nested and correlated queries, aggregate operators, null values, complex integrity constraints and triggers.",
          ),
          ch(
            8,
            "Overview of Storage and Indexing",
            "Data on external storage, file organisations, clustered and unclustered indexes, hash and tree-based indexing, and comparing file organisations by cost.",
          ),
          ch(
            10,
            "Tree-Structured Indexing",
            "Indexed sequential access, the B+ tree as a dynamic index structure, search, insert and delete, duplicates and bulk loading.",
          ),
          ch(
            16,
            "Overview of Transaction Management",
            "The ACID properties, schedules, concurrent execution and its anomalies, lock-based concurrency control and crash recovery.",
          ),
          ch(
            19,
            "Schema Refinement and Normal Forms",
            "Problems caused by redundancy, functional dependencies, reasoning about them, normal forms, decomposition and properties of good decompositions.",
          ),
        ],
      },
    ],
  },
  {
    title: "Designing Data-Intensive Applications",
    subtitle: "The Big Ideas Behind Reliable, Scalable, and Maintainable Systems",
    authors: ["Martin Kleppmann"],
    category: "databases",
    rack: "CS-04",
    tags: ["distributed-systems"],
    description:
      "How data systems really work under load: storage engines, replication, partitioning, transactions, consistency and stream processing, explained through the trade-offs real systems make.",
    editions: [
      {
        isbn13: "9781449373320",
        editionNo: 1,
        publisher: "O'Reilly Media",
        year: 2017,
        pages: 624,
        totalChapters: 12,
        chapters: [
          ch(
            1,
            "Reliable, Scalable, and Maintainable Applications",
            "What reliability, scalability and maintainability mean for a data system, how to describe load and performance, and percentiles for response time.",
          ),
          ch(
            2,
            "Data Models and Query Languages",
            "Relational versus document models, many-to-one and many-to-many relationships, declarative query languages and graph data models.",
          ),
          ch(
            3,
            "Storage and Retrieval",
            "Log-structured storage and SSTables, B-trees, the trade-offs between them, and how transaction processing differs from analytics and column stores.",
          ),
          ch(
            5,
            "Replication",
            "Leaders and followers, replication lag and read-after-write consistency, multi-leader and leaderless replication, quorums and conflict handling.",
          ),
          ch(
            6,
            "Partitioning",
            "Splitting data by key range or hash, secondary indexes on partitioned data, rebalancing partitions and routing requests.",
          ),
          ch(
            7,
            "Transactions",
            "What ACID really promises, weak isolation levels and the anomalies they allow, preventing lost updates and write skew, and serializability in practice.",
          ),
          ch(
            9,
            "Consistency and Consensus",
            "Linearizability, ordering guarantees, distributed transactions, two-phase commit and fault-tolerant consensus.",
          ),
          ch(
            11,
            "Stream Processing",
            "Event streams and message brokers, change data capture, event sourcing, and processing and joining streams with fault tolerance.",
          ),
        ],
      },
    ],
  },

  // Algorithms
  {
    title: "Introduction to Algorithms",
    authors: ["Thomas H. Cormen", "Charles E. Leiserson", "Ronald L. Rivest", "Clifford Stein"],
    category: "algorithms",
    rack: "CS-01",
    tags: ["data-structures", "graphs"],
    description:
      "The comprehensive reference on the design and analysis of algorithms: sorting, data structures, dynamic programming, greedy methods, graph algorithms and NP-completeness, with rigorous analysis.",
    editions: [
      {
        isbn13: "9780262033848",
        editionNo: 3,
        publisher: "MIT Press",
        year: 2009,
        pages: 1292,
        format: "HARDCOVER",
        totalChapters: 35,
        chapters: [
          ch(
            2,
            "Getting Started",
            "Insertion sort, loop invariants and correctness, analysing running time, and the divide-and-conquer approach through merge sort.",
          ),
          ch(
            4,
            "Divide-and-Conquer",
            "The maximum subarray problem, Strassen's matrix multiplication, and solving recurrences with substitution, recursion trees and the master method.",
          ),
          ch(
            6,
            "Heapsort",
            "Binary heaps, maintaining the heap property, building a heap, heapsort and priority queues.",
          ),
          ch(
            7,
            "Quicksort",
            "Partitioning, the performance of quicksort, a randomised version and its expected running time.",
          ),
          ch(
            11,
            "Hash Tables",
            "Direct addressing, chaining, hash functions, open addressing with linear and quadratic probing and double hashing, and perfect hashing.",
          ),
          ch(
            12,
            "Binary Search Trees",
            "Searching, minimum and maximum, successor, insertion and deletion in binary search trees, and randomly built trees.",
          ),
          ch(
            15,
            "Dynamic Programming",
            "Rod cutting, matrix-chain multiplication, the elements of dynamic programming, longest common subsequence and optimal binary search trees.",
          ),
          ch(
            16,
            "Greedy Algorithms",
            "Activity selection, the elements of the greedy strategy, Huffman codes and matroids.",
          ),
          ch(
            18,
            "B-Trees",
            "Balanced search trees designed for disk storage: their definition, searching, and inserting and deleting keys while keeping the tree balanced.",
          ),
          ch(
            22,
            "Elementary Graph Algorithms",
            "Representing graphs, breadth-first search, depth-first search, topological sort and strongly connected components.",
          ),
          ch(
            24,
            "Single-Source Shortest Paths",
            "The Bellman-Ford algorithm, shortest paths in directed acyclic graphs, Dijkstra's algorithm and difference constraints.",
          ),
          ch(
            34,
            "NP-Completeness",
            "Polynomial time, verification, NP-completeness and reducibility, and proofs that problems such as satisfiability and the travelling salesman problem are NP-complete.",
          ),
        ],
      },
      {
        isbn13: "9780262046305",
        editionNo: 4,
        publisher: "MIT Press",
        year: 2022,
        pages: 1332,
        format: "HARDCOVER",
        totalChapters: 35,
        chapters: [
          ch(
            2,
            "Getting Started",
            "Insertion sort with loop invariants, analysing algorithms, and merge sort as the first divide-and-conquer algorithm.",
          ),
          ch(
            4,
            "Divide-and-Conquer",
            "Matrix multiplication and Strassen's method, and solving recurrences by substitution, recursion trees, the master method and Akra-Bazzi.",
          ),
          ch(
            14,
            "Dynamic Programming",
            "Rod cutting, matrix-chain multiplication, longest common subsequence and optimal binary search trees, and when dynamic programming applies.",
          ),
          ch(
            15,
            "Greedy Algorithms",
            "Activity selection, the greedy-choice property, Huffman codes and offline caching.",
          ),
          ch(
            18,
            "B-Trees",
            "Multiway balanced trees for secondary storage, with search, insertion and deletion that touch few disk blocks.",
          ),
          ch(
            20,
            "Elementary Graph Algorithms",
            "Adjacency lists and matrices, breadth-first and depth-first search, topological sort and strongly connected components.",
          ),
          ch(
            22,
            "Single-Source Shortest Paths",
            "Bellman-Ford, shortest paths in acyclic graphs, Dijkstra's algorithm and difference constraints.",
          ),
          ch(
            34,
            "NP-Completeness",
            "Complexity classes P and NP, polynomial-time reductions, and the canonical NP-complete problems.",
          ),
        ],
      },
    ],
  },
  {
    title: "Algorithm Design",
    authors: ["Jon Kleinberg", "Éva Tardos"],
    category: "algorithms",
    rack: "CS-01",
    description:
      "Algorithm design driven by real problems: greedy methods, divide and conquer, dynamic programming, network flow and intractability, each introduced through a concrete application.",
    editions: [
      {
        isbn13: "9780321295354",
        editionNo: 1,
        publisher: "Addison-Wesley",
        year: 2005,
        pages: 864,
        format: "HARDCOVER",
        totalChapters: 13,
        chapters: [
          ch(
            1,
            "Introduction: Some Representative Problems",
            "Stable matching and five representative problems that preview the design techniques used in the rest of the book.",
          ),
          ch(
            4,
            "Greedy Algorithms",
            "Interval scheduling, scheduling to minimise lateness, shortest paths, minimum spanning trees and clustering, with exchange arguments for correctness.",
          ),
          ch(
            5,
            "Divide and Conquer",
            "Mergesort and recurrences, counting inversions, finding the closest pair of points, integer multiplication and convolutions.",
          ),
          ch(
            6,
            "Dynamic Programming",
            "Weighted interval scheduling, segmented least squares, knapsack, sequence alignment and shortest paths with negative edges.",
          ),
          ch(
            7,
            "Network Flow",
            "Maximum flow and minimum cut, the Ford-Fulkerson algorithm, bipartite matching and applications of flow to scheduling and selection.",
          ),
          ch(
            8,
            "NP and Computational Intractability",
            "Polynomial-time reductions, efficient certification, NP-complete problems and how to recognise intractable problems in practice.",
          ),
        ],
      },
    ],
  },
  {
    title: "Algorithms",
    authors: ["Robert Sedgewick", "Kevin Wayne"],
    category: "algorithms",
    rack: "CS-01",
    description:
      "Essential algorithms and data structures with working Java implementations: sorting, searching, graphs and strings, and the scientific method for measuring performance.",
    editions: [
      {
        isbn13: "9780321573513",
        editionNo: 4,
        publisher: "Addison-Wesley",
        year: 2011,
        pages: 955,
        format: "HARDCOVER",
        totalChapters: 6,
        chapters: [
          ch(
            2,
            "Sorting",
            "Elementary sorts, mergesort, quicksort and priority queues, and how sorting is used across applications.",
          ),
          ch(
            3,
            "Searching",
            "Symbol tables, binary search trees, balanced red-black trees and hash tables.",
          ),
          ch(
            4,
            "Graphs",
            "Undirected and directed graphs, minimum spanning trees and shortest paths.",
          ),
          ch(
            5,
            "Strings",
            "String sorts, tries, substring search, regular expressions and data compression.",
          ),
        ],
      },
    ],
  },

  // Operating systems
  {
    title: "Operating System Concepts",
    authors: ["Abraham Silberschatz", "Peter Baer Galvin", "Greg Gagne"],
    category: "operating-systems",
    rack: "CS-02",
    tags: ["concurrency"],
    description:
      "The standard operating systems text: processes and threads, CPU scheduling, synchronisation, deadlocks, memory and virtual memory, storage and file systems, and protection.",
    editions: [
      {
        isbn13: "9781118063330",
        editionNo: 9,
        publisher: "Wiley",
        year: 2013,
        pages: 919,
        format: "HARDCOVER",
        totalChapters: 19,
        chapters: [
          ch(
            5,
            "Process Synchronization",
            "The critical-section problem, Peterson's solution, mutex locks, semaphores and monitors, and classic problems such as bounded buffer and dining philosophers.",
          ),
          ch(
            7,
            "Deadlocks",
            "Conditions for deadlock, resource-allocation graphs, prevention, avoidance with the banker's algorithm, detection and recovery.",
          ),
        ],
      },
      {
        isbn13: "9781119320913",
        editionNo: 10,
        publisher: "Wiley",
        year: 2018,
        pages: 1536,
        format: "HARDCOVER",
        totalChapters: 21,
        chapters: [
          ch(
            1,
            "Introduction",
            "What an operating system does, computer-system organisation and architecture, multiprogramming and multitasking, and resource management.",
          ),
          ch(
            3,
            "Processes",
            "The process concept, process scheduling, creating and terminating processes, and interprocess communication with shared memory and message passing.",
          ),
          ch(
            4,
            "Threads & Concurrency",
            "Multicore programming, multithreading models, thread libraries, implicit threading and threading issues.",
          ),
          ch(
            5,
            "CPU Scheduling",
            "Scheduling criteria, first-come first-served, shortest-job-first, priority and round-robin scheduling, multilevel queues and multiprocessor scheduling.",
          ),
          ch(
            6,
            "Synchronization Tools",
            "Race conditions and the critical-section problem, hardware support, mutex locks, semaphores, monitors and liveness.",
          ),
          ch(
            8,
            "Deadlocks",
            "System model, deadlock characterisation, prevention, avoidance with the banker's algorithm, detection and recovery.",
          ),
          ch(
            9,
            "Main Memory",
            "Address binding, contiguous allocation, paging, page table structure, swapping and segmentation.",
          ),
          ch(
            10,
            "Virtual Memory",
            "Demand paging, copy-on-write, page replacement algorithms such as FIFO, optimal and LRU, frame allocation and thrashing.",
          ),
          ch(
            13,
            "File-System Interface",
            "The file concept, access methods, directory structure, protection and memory-mapped files.",
          ),
        ],
      },
    ],
  },
  {
    title: "Modern Operating Systems",
    authors: ["Andrew S. Tanenbaum", "Herbert Bos"],
    category: "operating-systems",
    rack: "CS-02",
    description:
      "Operating system design from the inside: processes and threads, memory management, file systems, input and output, deadlocks, virtualisation and case studies of Linux and Windows.",
    editions: [
      {
        isbn13: "9780133591620",
        editionNo: 4,
        publisher: "Pearson",
        year: 2015,
        pages: 1136,
        totalChapters: 13,
        chapters: [
          ch(
            2,
            "Processes and Threads",
            "The process model, threads, interprocess communication, race conditions, mutual exclusion, semaphores, monitors and scheduling.",
          ),
          ch(
            3,
            "Memory Management",
            "Address spaces, swapping, virtual memory, page tables, translation lookaside buffers and page replacement algorithms.",
          ),
          ch(
            4,
            "File Systems",
            "Files and directories, file-system implementation, management and optimisation, and example file systems.",
          ),
          ch(
            6,
            "Deadlocks",
            "Resources, the deadlock model, the ostrich algorithm, detection and recovery, avoidance and prevention.",
          ),
        ],
      },
    ],
  },
  {
    title: "Operating Systems: Three Easy Pieces",
    authors: ["Remzi H. Arpaci-Dusseau", "Andrea C. Arpaci-Dusseau"],
    category: "operating-systems",
    rack: "CS-02",
    tags: ["concurrency"],
    description:
      "A conversational introduction organised around virtualisation, concurrency and persistence, with short chapters that build each idea from the problem it solves.",
    editions: [
      {
        isbn13: "9781985086593",
        editionNo: 1,
        publisher: "CreateSpace",
        year: 2018,
        pages: 714,
        totalChapters: 50,
        chapters: [
          ch(
            7,
            "Scheduling: Introduction",
            "Workload assumptions and scheduling metrics, FIFO, shortest job first, shortest time-to-completion first and round robin, and the trade-off between turnaround and response time.",
          ),
          ch(
            13,
            "The Abstraction: Address Spaces",
            "Why each process gets the illusion of a private memory, and the goals of transparency, efficiency and protection for virtual memory.",
          ),
          ch(
            18,
            "Paging: Introduction",
            "Splitting memory into fixed-size pages, page tables and their contents, address translation and why paging alone is slow and large.",
          ),
          ch(
            26,
            "Concurrency: An Introduction",
            "Threads, shared data and race conditions, critical sections, atomicity and why we need synchronisation primitives.",
          ),
          ch(
            28,
            "Locks",
            "Building locks with test-and-set, compare-and-swap and ticket locks, spinning versus sleeping, and evaluating fairness and performance.",
          ),
          ch(
            31,
            "Semaphores",
            "Semaphores as locks and as condition variables, the producer-consumer problem, reader-writer locks and the dining philosophers.",
          ),
        ],
      },
    ],
  },

  // Networks
  {
    title: "Computer Networking",
    subtitle: "A Top-Down Approach",
    authors: ["James F. Kurose", "Keith W. Ross"],
    category: "networks",
    rack: "CS-03",
    tags: ["internet", "protocols"],
    description:
      "Networking taught from the application layer down: the web and DNS, TCP and UDP, routing and forwarding, the link layer, wireless networks and network security.",
    editions: [
      {
        isbn13: "9780133594140",
        editionNo: 7,
        publisher: "Pearson",
        year: 2016,
        pages: 864,
        totalChapters: 9,
        chapters: [
          ch(
            1,
            "Computer Networks and the Internet",
            "The network edge and core, packet switching versus circuit switching, delay, loss and throughput, protocol layers and network attacks.",
          ),
          ch(
            2,
            "Application Layer",
            "Principles of network applications, HTTP and the web, electronic mail, DNS, peer-to-peer file distribution and socket programming.",
          ),
          ch(
            3,
            "Transport Layer",
            "Multiplexing, UDP, principles of reliable data transfer, TCP connection management and flow control, and congestion control.",
          ),
          ch(
            4,
            "The Network Layer: Data Plane",
            "Forwarding and routing, what is inside a router, IP addressing, IPv4 and IPv6, and generalised forwarding.",
          ),
          ch(
            5,
            "The Network Layer: Control Plane",
            "Link-state and distance-vector routing, OSPF, BGP, software-defined networking and ICMP.",
          ),
          ch(
            6,
            "The Link Layer and LANs",
            "Error detection and correction, multiple access protocols, switched local area networks, Ethernet and VLANs.",
          ),
          ch(
            8,
            "Security in Computer Networks",
            "Cryptography principles, message integrity and digital signatures, authentication, securing email and TCP connections, firewalls and intrusion detection.",
          ),
        ],
      },
    ],
  },
  {
    title: "Computer Networks",
    authors: ["Andrew S. Tanenbaum", "David J. Wetherall"],
    category: "networks",
    rack: "CS-03",
    description:
      "A bottom-up tour of computer networks from the physical layer through data link, medium access, network and transport layers to applications.",
    editions: [
      {
        isbn13: "9780132126953",
        editionNo: 5,
        publisher: "Pearson",
        year: 2011,
        pages: 960,
        format: "HARDCOVER",
        totalChapters: 8,
        chapters: [
          ch(
            3,
            "The Data Link Layer",
            "Framing, error detection and correction codes, elementary data link protocols and sliding window protocols.",
          ),
          ch(
            4,
            "The Medium Access Control Sublayer",
            "Channel allocation, multiple access protocols such as ALOHA and CSMA, Ethernet, wireless LANs and switching.",
          ),
          ch(
            5,
            "The Network Layer",
            "Routing algorithms, congestion control, quality of service, internetworking and the network layer of the Internet.",
          ),
          ch(
            6,
            "The Transport Layer",
            "Transport services, elements of transport protocols, congestion control, UDP and TCP.",
          ),
        ],
      },
    ],
  },

  // Architecture
  {
    title: "Computer Organization and Design RISC-V Edition",
    subtitle: "The Hardware/Software Interface",
    authors: ["David A. Patterson", "John L. Hennessy"],
    category: "architecture",
    rack: "CS-03",
    description:
      "How computers work at the boundary of hardware and software, using the RISC-V instruction set: instructions, arithmetic, the processor datapath, pipelining and the memory hierarchy.",
    editions: [
      {
        isbn13: "9780128122754",
        editionNo: 1,
        publisher: "Morgan Kaufmann",
        year: 2017,
        pages: 696,
        totalChapters: 6,
        chapters: [
          ch(
            1,
            "Computer Abstractions and Technology",
            "Great ideas in computer architecture, below your program, performance and its measurement, and the power wall.",
          ),
          ch(
            2,
            "Instructions: Language of the Computer",
            "RISC-V operations and operands, representing instructions, logical operations, decisions, procedures and addressing.",
          ),
          ch(
            3,
            "Arithmetic for Computers",
            "Addition and subtraction, multiplication, division and floating point representation and arithmetic.",
          ),
          ch(
            4,
            "The Processor",
            "Building a datapath, a simple implementation, pipelining, data and control hazards, and exceptions.",
          ),
          ch(
            5,
            "Large and Fast: Exploiting Memory Hierarchy",
            "Locality, caches and their performance, dependable memory, virtual memory and a common framework for memory hierarchies.",
          ),
        ],
      },
    ],
  },
  {
    title: "Computer Architecture",
    subtitle: "A Quantitative Approach",
    authors: ["John L. Hennessy", "David A. Patterson"],
    category: "architecture",
    rack: "CS-03",
    description:
      "Advanced computer architecture measured with numbers: memory hierarchy design, instruction-level, data-level and thread-level parallelism, and warehouse-scale computers.",
    editions: [
      {
        isbn13: "9780128119051",
        editionNo: 6,
        publisher: "Morgan Kaufmann",
        year: 2019,
        pages: 936,
        totalChapters: 7,
        chapters: [
          ch(
            2,
            "Memory Hierarchy Design",
            "Cache optimisations, memory technology, virtual memory and virtual machines, and designing memory hierarchies for performance.",
          ),
          ch(
            3,
            "Instruction-Level Parallelism and Its Exploitation",
            "Pipelining limits, dynamic scheduling, branch prediction, speculation and multiple issue.",
          ),
          ch(
            4,
            "Data-Level Parallelism in Vector, SIMD, and GPU Architectures",
            "Vector architectures, SIMD instruction set extensions and graphics processing units.",
          ),
        ],
      },
    ],
  },

  // Languages and compilers
  {
    title: "Compilers: Principles, Techniques, and Tools",
    authors: ["Alfred V. Aho", "Monica S. Lam", "Ravi Sethi", "Jeffrey D. Ullman"],
    category: "languages",
    rack: "CS-05",
    description:
      "The classic compiler text: lexical analysis, parsing, syntax-directed translation, intermediate code, code generation and optimisation.",
    editions: [
      {
        isbn13: "9780321486813",
        editionNo: 2,
        publisher: "Addison-Wesley",
        year: 2006,
        pages: 1000,
        format: "HARDCOVER",
        totalChapters: 12,
        chapters: [
          ch(
            1,
            "Introduction",
            "Language processors, the structure of a compiler, the evolution of programming languages and the science of building a compiler.",
          ),
          ch(
            3,
            "Lexical Analysis",
            "Tokens and lexemes, specifying tokens with regular expressions, recognising them with finite automata and generating lexical analysers.",
          ),
          ch(
            4,
            "Syntax Analysis",
            "Context-free grammars, top-down parsing with recursive descent and LL(1), bottom-up shift-reduce and LR parsing, and parser generators.",
          ),
          ch(
            5,
            "Syntax-Directed Translation",
            "Syntax-directed definitions, evaluation orders for attributes and translation schemes.",
          ),
          ch(
            6,
            "Intermediate-Code Generation",
            "Syntax trees, three-address code, types and declarations, and translating expressions and control flow.",
          ),
          ch(
            9,
            "Machine-Independent Optimizations",
            "Sources of optimisation, data-flow analysis, constant propagation, partial-redundancy elimination and loops in flow graphs.",
          ),
        ],
      },
    ],
  },
  {
    title: "The C Programming Language",
    authors: ["Brian W. Kernighan", "Dennis M. Ritchie"],
    category: "languages",
    rack: "CS-05",
    description:
      "The concise original guide to C: types, operators, control flow, functions, pointers and arrays, structures and the standard library.",
    editions: [
      {
        isbn13: "9780131103627",
        editionNo: 2,
        publisher: "Prentice Hall",
        year: 1988,
        pages: 272,
        totalChapters: 8,
        chapters: [
          ch(
            1,
            "A Tutorial Introduction",
            "A first tour of C through small programs: variables, arithmetic, loops, character input and output, arrays and functions.",
          ),
          ch(
            5,
            "Pointers and Arrays",
            "Pointers and addresses, pointers as function arguments, pointer arithmetic, character pointers and multi-dimensional arrays.",
          ),
          ch(
            6,
            "Structures",
            "Structures and functions, arrays of structures, self-referential structures, table lookup, unions and bit-fields.",
          ),
        ],
      },
    ],
  },
  {
    title: "Structure and Interpretation of Computer Programs",
    authors: ["Harold Abelson", "Gerald Jay Sussman", "Julie Sussman"],
    category: "languages",
    rack: "CS-05",
    description:
      "Programming as the construction of abstractions, taught in Scheme: procedures, data abstraction, state, interpreters and register machines.",
    editions: [
      {
        isbn13: "9780262510875",
        editionNo: 2,
        publisher: "MIT Press",
        year: 1996,
        pages: 683,
        totalChapters: 5,
        chapters: [
          ch(
            1,
            "Building Abstractions with Procedures",
            "Expressions and naming, procedures and the processes they generate, recursion and iteration, and higher-order procedures.",
          ),
          ch(
            2,
            "Building Abstractions with Data",
            "Data abstraction, hierarchical data and closure, symbolic data and multiple representations of abstract data.",
          ),
          ch(
            3,
            "Modularity, Objects, and State",
            "Assignment and local state, the environment model of evaluation, mutable data, concurrency and streams.",
          ),
          ch(
            4,
            "Metalinguistic Abstraction",
            "Writing an interpreter for the language itself, lazy evaluation, nondeterministic computing and logic programming.",
          ),
        ],
      },
    ],
  },

  // Software engineering
  {
    title: "Software Engineering",
    authors: ["Ian Sommerville"],
    category: "software-engineering",
    rack: "CS-05",
    tags: ["process", "testing"],
    description:
      "Software engineering practice end to end: processes, agile methods, requirements, modelling, architecture, testing, evolution and dependable systems.",
    editions: [
      {
        isbn13: "9780133943030",
        editionNo: 10,
        publisher: "Pearson",
        year: 2015,
        pages: 816,
        totalChapters: 25,
        chapters: [
          ch(
            2,
            "Software Processes",
            "Waterfall, incremental and integration-based process models, process activities, coping with change and process improvement.",
          ),
          ch(
            3,
            "Agile Software Development",
            "Agile methods, extreme programming practices, Scrum and scaling agile methods to large systems.",
          ),
          ch(
            4,
            "Requirements Engineering",
            "Functional and non-functional requirements, elicitation, specification, validation and change management.",
          ),
          ch(
            6,
            "Architectural Design",
            "Architectural decisions, views and patterns such as layered, repository, client-server and pipe-and-filter architectures.",
          ),
          ch(
            8,
            "Software Testing",
            "Development testing, test-driven development, release testing and user testing.",
          ),
        ],
      },
    ],
  },
  {
    title: "Clean Code",
    subtitle: "A Handbook of Agile Software Craftsmanship",
    authors: ["Robert C. Martin"],
    category: "software-engineering",
    rack: "CS-05",
    description:
      "Practical guidance on writing code that others can read and change: naming, small functions, comments, error handling, tests and class design.",
    editions: [
      {
        isbn13: "9780132350884",
        editionNo: 1,
        publisher: "Prentice Hall",
        year: 2008,
        pages: 431,
        totalChapters: 17,
        chapters: [
          ch(
            2,
            "Meaningful Names",
            "Choosing names that reveal intent, avoiding disinformation, making meaningful distinctions and using searchable, pronounceable names.",
          ),
          ch(
            3,
            "Functions",
            "Keeping functions small, doing one thing, one level of abstraction, few arguments, no side effects and command-query separation.",
          ),
          ch(
            7,
            "Error Handling",
            "Using exceptions rather than return codes, writing try-catch-finally first, providing context and not returning or passing null.",
          ),
          ch(
            9,
            "Unit Tests",
            "The laws of test-driven development, keeping tests clean, one concept per test and the FIRST properties of good tests.",
          ),
        ],
      },
    ],
  },
  {
    title: "Design Patterns",
    subtitle: "Elements of Reusable Object-Oriented Software",
    authors: ["Erich Gamma", "Richard Helm", "Ralph Johnson", "John Vlissides"],
    category: "software-engineering",
    rack: "CS-05",
    description:
      "The catalogue of twenty-three object-oriented design patterns, grouped as creational, structural and behavioural, with the problems each solves.",
    editions: [
      {
        isbn13: "9780201633610",
        editionNo: 1,
        publisher: "Addison-Wesley",
        year: 1995,
        pages: 395,
        format: "HARDCOVER",
        totalChapters: 6,
        chapters: [
          ch(
            3,
            "Creational Patterns",
            "Abstract factory, builder, factory method, prototype and singleton: ways to decouple a system from how its objects are created.",
          ),
          ch(
            4,
            "Structural Patterns",
            "Adapter, bridge, composite, decorator, facade, flyweight and proxy: composing classes and objects into larger structures.",
          ),
          ch(
            5,
            "Behavioral Patterns",
            "Chain of responsibility, command, iterator, observer, state, strategy, visitor and others: assigning responsibilities between objects.",
          ),
        ],
      },
    ],
  },

  // Artificial intelligence and machine learning
  {
    title: "Artificial Intelligence",
    subtitle: "A Modern Approach",
    authors: ["Stuart Russell", "Peter Norvig"],
    category: "artificial-intelligence",
    rack: "CS-06",
    tags: ["search", "machine-learning"],
    description:
      "The standard AI text, built around intelligent agents: search, constraint satisfaction, logic, planning, probabilistic reasoning, machine learning, language and perception.",
    editions: [
      {
        isbn13: "9780136042594",
        editionNo: 3,
        publisher: "Prentice Hall",
        year: 2009,
        pages: 1152,
        format: "HARDCOVER",
        totalChapters: 27,
        chapters: [
          ch(
            3,
            "Solving Problems by Searching",
            "Problem-solving agents, uninformed search strategies such as breadth-first and depth-first, informed search with A* and designing heuristic functions.",
          ),
          ch(
            6,
            "Constraint Satisfaction Problems",
            "Defining CSPs, constraint propagation and arc consistency, backtracking search and local search for constraint problems.",
          ),
        ],
      },
      {
        isbn13: "9780134610993",
        editionNo: 4,
        publisher: "Pearson",
        year: 2020,
        pages: 1136,
        format: "HARDCOVER",
        totalChapters: 28,
        chapters: [
          ch(
            2,
            "Intelligent Agents",
            "Agents and environments, rationality, task environments and the structure of reflex, goal-based, utility-based and learning agents.",
          ),
          ch(
            3,
            "Solving Problems by Searching",
            "Search problems, uninformed strategies, best-first and A* search, and admissible and consistent heuristics.",
          ),
          ch(
            6,
            "Constraint Satisfaction Problems",
            "Variables, domains and constraints, inference with arc consistency, backtracking with heuristics, and local search.",
          ),
          ch(
            7,
            "Logical Agents",
            "Knowledge-based agents, propositional logic, inference and theorem proving, and model checking.",
          ),
          ch(
            12,
            "Quantifying Uncertainty",
            "Acting under uncertainty, basic probability notation, inference using full joint distributions, independence and Bayes' rule.",
          ),
          ch(
            19,
            "Learning from Examples",
            "Supervised learning, decision trees, model selection and regularisation, linear regression and classification, and ensemble learning.",
          ),
          ch(
            21,
            "Deep Learning",
            "Feedforward networks, computation graphs, convolutional and recurrent networks, learning algorithms and generalisation.",
          ),
        ],
      },
    ],
  },
  {
    title: "Pattern Recognition and Machine Learning",
    authors: ["Christopher M. Bishop"],
    category: "machine-learning",
    rack: "CS-06",
    description:
      "A probabilistic treatment of machine learning: Bayesian methods, linear models, neural networks, kernel methods, graphical models and mixture models.",
    editions: [
      {
        isbn13: "9780387310732",
        editionNo: 1,
        publisher: "Springer",
        year: 2006,
        pages: 738,
        format: "HARDCOVER",
        totalChapters: 14,
        chapters: [
          ch(
            1,
            "Introduction",
            "Polynomial curve fitting, probability theory, model selection, the curse of dimensionality, decision theory and information theory.",
          ),
          ch(
            3,
            "Linear Models for Regression",
            "Linear basis function models, the bias-variance decomposition and Bayesian linear regression.",
          ),
          ch(
            4,
            "Linear Models for Classification",
            "Discriminant functions, probabilistic generative and discriminative models, and logistic regression.",
          ),
          ch(
            5,
            "Neural Networks",
            "Feed-forward networks, training with error backpropagation, regularisation and mixture density networks.",
          ),
          ch(
            9,
            "Mixture Models and EM",
            "K-means clustering, Gaussian mixtures and the expectation-maximisation algorithm.",
          ),
        ],
      },
    ],
  },
  {
    title: "Deep Learning",
    authors: ["Ian Goodfellow", "Yoshua Bengio", "Aaron Courville"],
    category: "machine-learning",
    rack: "CS-06",
    tags: ["neural-networks"],
    description:
      "The mathematical and conceptual foundations of deep learning: feedforward, convolutional and recurrent networks, regularisation, optimisation and research directions.",
    editions: [
      {
        isbn13: "9780262035613",
        editionNo: 1,
        publisher: "MIT Press",
        year: 2016,
        pages: 800,
        format: "HARDCOVER",
        totalChapters: 20,
        chapters: [
          ch(
            5,
            "Machine Learning Basics",
            "Learning algorithms, capacity, overfitting and underfitting, hyperparameters and validation, estimators, bias and variance, and stochastic gradient descent.",
          ),
          ch(
            6,
            "Deep Feedforward Networks",
            "Learning XOR, gradient-based learning, hidden units, architecture design and back-propagation.",
          ),
          ch(
            7,
            "Regularization for Deep Learning",
            "Parameter norm penalties, dataset augmentation, early stopping, parameter sharing and dropout.",
          ),
          ch(
            9,
            "Convolutional Networks",
            "The convolution operation, motivation, pooling, variants of convolution and efficient algorithms.",
          ),
          ch(
            10,
            "Sequence Modeling: Recurrent and Recursive Nets",
            "Unfolding computational graphs, recurrent neural networks, long short-term memory and gated units.",
          ),
        ],
      },
    ],
  },
  {
    title: "Introduction to Information Retrieval",
    authors: ["Christopher D. Manning", "Prabhakar Raghavan", "Hinrich Schütze"],
    category: "information-retrieval",
    rack: "CS-06",
    tags: ["search"],
    description:
      "How search engines find and rank documents: indexing, the vector space model, evaluation, relevance feedback, classification, clustering and web search.",
    editions: [
      {
        isbn13: "9780521865715",
        editionNo: 1,
        publisher: "Cambridge University Press",
        year: 2008,
        pages: 482,
        format: "HARDCOVER",
        totalChapters: 21,
        chapters: [
          ch(
            1,
            "Boolean retrieval",
            "Building an inverted index and processing Boolean queries over it, with an example of searching a collection of plays.",
          ),
          ch(
            2,
            "The term vocabulary and postings lists",
            "Tokenisation, stop words, normalisation, stemming and lemmatisation, skip pointers and positional indexes for phrase queries.",
          ),
          ch(
            6,
            "Scoring, term weighting and the vector space model",
            "Term frequency and inverse document frequency, tf-idf weighting, cosine similarity and ranking documents as vectors.",
          ),
          ch(
            8,
            "Evaluation in information retrieval",
            "Test collections, precision and recall, mean average precision, ranked evaluation and assessing relevance.",
          ),
          ch(
            9,
            "Relevance feedback and query expansion",
            "The Rocchio algorithm, pseudo relevance feedback and expanding queries with a thesaurus.",
          ),
          ch(
            18,
            "Matrix decompositions and latent semantic indexing",
            "Singular value decomposition, low-rank approximation and latent semantic indexing to match documents by meaning rather than exact words.",
          ),
        ],
      },
    ],
  },

  // Theory and security
  {
    title: "Introduction to the Theory of Computation",
    authors: ["Michael Sipser"],
    category: "theory-of-computation",
    rack: "CS-06",
    description:
      "Automata, computability and complexity: regular and context-free languages, Turing machines, decidability, reducibility and time complexity.",
    editions: [
      {
        isbn13: "9781133187790",
        editionNo: 3,
        publisher: "Cengage Learning",
        year: 2013,
        pages: 458,
        format: "HARDCOVER",
        totalChapters: 10,
        chapters: [
          ch(
            1,
            "Regular Languages",
            "Finite automata, nondeterminism, regular expressions and nonregular languages with the pumping lemma.",
          ),
          ch(
            2,
            "Context-Free Languages",
            "Context-free grammars, pushdown automata and non-context-free languages.",
          ),
          ch(
            4,
            "Decidability",
            "Decidable languages and the undecidability of the halting problem through diagonalisation.",
          ),
          ch(
            7,
            "Time Complexity",
            "Measuring complexity, the classes P and NP, NP-completeness and the Cook-Levin theorem.",
          ),
        ],
      },
    ],
  },
  {
    title: "Cryptography and Network Security",
    subtitle: "Principles and Practice",
    authors: ["William Stallings"],
    category: "security",
    rack: "CS-03",
    tags: ["security"],
    description:
      "Cryptographic algorithms and the protocols built on them: classical and block ciphers, AES, public-key cryptography, hashing, authentication and network security.",
    editions: [
      {
        isbn13: "9780134444284",
        editionNo: 7,
        publisher: "Pearson",
        year: 2016,
        pages: 768,
        totalChapters: 23,
        chapters: [
          ch(
            3,
            "Classical Encryption Techniques",
            "Symmetric cipher model, substitution and transposition ciphers, the Caesar, Playfair and Vigenere ciphers and rotor machines.",
          ),
          ch(
            4,
            "Block Ciphers and the Data Encryption Standard",
            "Block cipher structure, the Feistel cipher, DES, its strength and block cipher design principles.",
          ),
          ch(
            9,
            "Public-Key Cryptography and RSA",
            "Principles of public-key cryptosystems and the RSA algorithm, its computation and security.",
          ),
          ch(
            11,
            "Cryptographic Hash Functions",
            "Requirements and security of hash functions, applications to message authentication and SHA-3.",
          ),
        ],
      },
    ],
  },

  // Electronics
  {
    title: "Microelectronic Circuits",
    authors: ["Adel S. Sedra", "Kenneth C. Smith"],
    category: "analog-circuits",
    rack: "EC-01",
    description:
      "Analysis and design of electronic circuits: amplifiers, operational amplifiers, diodes, MOSFETs and BJTs, and integrated-circuit amplifiers.",
    editions: [
      {
        isbn13: "9780199339136",
        editionNo: 7,
        publisher: "Oxford University Press",
        year: 2014,
        pages: 1488,
        format: "HARDCOVER",
        totalChapters: 17,
        chapters: [
          ch(
            1,
            "Signals and Amplifiers",
            "Signals and their spectra, analog and digital signals, amplifier models and frequency response.",
          ),
          ch(
            2,
            "Operational Amplifiers",
            "The ideal op amp, inverting and noninverting configurations, difference amplifiers, integrators and differentiators.",
          ),
          ch(
            4,
            "Diodes",
            "The ideal diode, terminal characteristics, modelling, rectifier circuits and limiting circuits.",
          ),
          ch(
            5,
            "MOS Field-Effect Transistors (MOSFETs)",
            "Device structure and operation, current-voltage characteristics and MOSFET circuits at DC.",
          ),
        ],
      },
    ],
  },
  {
    title: "Digital Design",
    authors: ["M. Morris Mano", "Michael D. Ciletti"],
    category: "digital-design",
    rack: "EC-02",
    description:
      "Digital logic design with an introduction to Verilog: number systems, Boolean algebra, minimisation, combinational and sequential circuits.",
    editions: [
      {
        isbn13: "9780132774208",
        editionNo: 5,
        publisher: "Pearson",
        year: 2011,
        pages: 576,
        totalChapters: 8,
        chapters: [
          ch(
            1,
            "Digital Systems and Binary Numbers",
            "Number systems and base conversions, complements, signed binary numbers, binary codes and binary logic.",
          ),
          ch(
            2,
            "Boolean Algebra and Logic Gates",
            "Axioms and theorems of Boolean algebra, Boolean functions, canonical and standard forms, and digital logic gates.",
          ),
          ch(
            3,
            "Gate-Level Minimization",
            "Karnaugh maps, product-of-sums simplification, don't-care conditions and NAND and NOR implementation.",
          ),
          ch(
            4,
            "Combinational Logic",
            "Analysis and design procedures, adders and subtractors, comparators, decoders, encoders and multiplexers.",
          ),
          ch(
            5,
            "Synchronous Sequential Logic",
            "Latches and flip-flops, analysis of clocked sequential circuits, state reduction and design procedure.",
          ),
        ],
      },
    ],
  },
  {
    title: "Signals and Systems",
    authors: ["Alan V. Oppenheim", "Alan S. Willsky", "S. Hamid Nawab"],
    category: "signals-communication",
    rack: "EC-03",
    description:
      "Continuous and discrete-time signals and systems: LTI systems, Fourier analysis, sampling, and the Laplace and z-transforms.",
    editions: [
      {
        isbn13: "9780138147570",
        editionNo: 2,
        publisher: "Prentice Hall",
        year: 1997,
        pages: 957,
        format: "HARDCOVER",
        totalChapters: 11,
        chapters: [
          ch(
            2,
            "Linear Time-Invariant Systems",
            "Discrete and continuous-time convolution, properties of LTI systems and systems described by differential and difference equations.",
          ),
          ch(
            4,
            "The Continuous-Time Fourier Transform",
            "The Fourier transform of aperiodic signals, its properties, the convolution and multiplication properties.",
          ),
          ch(
            7,
            "Sampling",
            "The sampling theorem, reconstruction with interpolation, aliasing, and discrete-time processing of continuous-time signals.",
          ),
          ch(
            10,
            "The Z-Transform",
            "The z-transform, region of convergence, inverse transform, properties and analysis of LTI systems.",
          ),
        ],
      },
    ],
  },
  {
    title: "Communication Systems",
    authors: ["Simon Haykin"],
    category: "signals-communication",
    rack: "EC-03",
    description:
      "Analog and digital communication: modulation, noise, pulse modulation, baseband and passband data transmission, and spread spectrum.",
    editions: [
      {
        isbn13: "9780471178699",
        editionNo: 4,
        publisher: "Wiley",
        year: 2001,
        pages: 816,
        format: "HARDCOVER",
        totalChapters: 10,
        chapters: [],
      },
    ],
  },
  {
    title: "The Art of Electronics",
    authors: ["Paul Horowitz", "Winfield Hill"],
    category: "analog-circuits",
    rack: "EC-01",
    description:
      "A practical, design-oriented guide to analog and digital electronics, written for people who build circuits.",
    editions: [
      {
        isbn13: "9780521809269",
        editionNo: 3,
        publisher: "Cambridge University Press",
        year: 2015,
        pages: 1224,
        format: "HARDCOVER",
        totalChapters: 15,
        chapters: [],
      },
    ],
  },

  // Electrical
  {
    title: "Fundamentals of Electric Circuits",
    authors: ["Charles K. Alexander", "Matthew N. O. Sadiku"],
    category: "circuit-analysis",
    rack: "EC-04",
    description:
      "Circuit analysis for first courses: basic laws, analysis methods, circuit theorems, first and second-order circuits, AC analysis and frequency response.",
    editions: [
      {
        isbn13: "9780073380575",
        editionNo: 5,
        publisher: "McGraw-Hill Education",
        year: 2012,
        pages: 991,
        format: "HARDCOVER",
        totalChapters: 19,
        chapters: [
          ch(
            2,
            "Basic Laws",
            "Ohm's law, nodes, branches and loops, Kirchhoff's current and voltage laws, series and parallel resistors and wye-delta transformations.",
          ),
          ch(
            3,
            "Methods of Analysis",
            "Nodal analysis and mesh analysis, including circuits with voltage and current sources.",
          ),
          ch(
            4,
            "Circuit Theorems",
            "Linearity, superposition, source transformation, Thevenin's and Norton's theorems and maximum power transfer.",
          ),
        ],
      },
    ],
  },
  {
    title: "Electric Machinery",
    authors: ["A. E. Fitzgerald", "Charles Kingsley", "Stephen D. Umans"],
    category: "machines-power",
    rack: "EC-04",
    description:
      "Transformers and rotating machines: magnetic circuits, electromechanical energy conversion, synchronous, induction and DC machines.",
    editions: [
      {
        isbn13: "9780073660097",
        editionNo: 6,
        publisher: "McGraw-Hill Education",
        year: 2002,
        pages: 704,
        format: "HARDCOVER",
        totalChapters: 11,
        chapters: [],
      },
    ],
  },
  {
    title: "Power System Analysis",
    authors: ["John J. Grainger", "William D. Stevenson"],
    category: "machines-power",
    rack: "EC-04",
    description:
      "Steady-state and fault analysis of power systems: per-unit quantities, network models, load flow, economic dispatch, symmetrical components and stability.",
    editions: [
      {
        isbn13: "9780070612938",
        editionNo: 1,
        publisher: "McGraw-Hill Education",
        year: 1994,
        pages: 787,
        totalChapters: 16,
        chapters: [],
      },
    ],
  },

  // Mechanical
  {
    title: "Engineering Mechanics: Statics",
    authors: ["J. L. Meriam", "L. G. Kraige"],
    category: "mechanics-design",
    rack: "ME-01",
    description:
      "Statics for engineers: force systems, equilibrium, structures, distributed forces, friction and virtual work.",
    editions: [
      {
        isbn13: "9780470614730",
        editionNo: 7,
        publisher: "Wiley",
        year: 2012,
        pages: 544,
        format: "HARDCOVER",
        totalChapters: 7,
        chapters: [],
      },
    ],
  },
  {
    title: "Shigley's Mechanical Engineering Design",
    authors: ["Richard G. Budynas", "J. Keith Nisbett"],
    category: "mechanics-design",
    rack: "ME-02",
    description:
      "Designing machine elements against failure: stress and deflection, fatigue, shafts, screws, bearings, gears and springs.",
    editions: [
      {
        isbn13: "9780073398204",
        editionNo: 10,
        publisher: "McGraw-Hill Education",
        year: 2014,
        pages: 1104,
        format: "HARDCOVER",
        totalChapters: 20,
        chapters: [],
      },
    ],
  },
  {
    title: "Fundamentals of Heat and Mass Transfer",
    authors: ["Theodore L. Bergman", "Adrienne S. Lavine", "Frank P. Incropera", "David P. DeWitt"],
    category: "thermal-sciences",
    rack: "ME-03",
    description:
      "Conduction, convection and radiation heat transfer, heat exchangers and mass transfer, with engineering problem-solving throughout.",
    editions: [
      {
        isbn13: "9780470501979",
        editionNo: 7,
        publisher: "Wiley",
        year: 2011,
        pages: 1048,
        format: "HARDCOVER",
        totalChapters: 14,
        chapters: [
          ch(
            1,
            "Introduction",
            "Modes of heat transfer, conduction, convection and radiation, their rate equations and the conservation of energy.",
          ),
          ch(
            3,
            "One-Dimensional, Steady-State Conduction",
            "The plane wall, thermal resistance, radial systems, heat generation and heat transfer from extended surfaces such as fins.",
          ),
          ch(
            6,
            "Introduction to Convection",
            "Velocity and thermal boundary layers, laminar and turbulent flow, and the dimensionless groups that describe convection.",
          ),
        ],
      },
    ],
  },
  {
    title: "Thermodynamics",
    subtitle: "An Engineering Approach",
    authors: ["Yunus A. Çengel", "Michael A. Boles"],
    category: "thermal-sciences",
    rack: "ME-03",
    description:
      "Engineering thermodynamics: properties of pure substances, energy analysis of closed and open systems, the second law, entropy and power and refrigeration cycles.",
    editions: [
      {
        isbn13: "9780073398174",
        editionNo: 8,
        publisher: "McGraw-Hill Education",
        year: 2015,
        pages: 1024,
        format: "HARDCOVER",
        totalChapters: 18,
        chapters: [
          ch(
            2,
            "Energy, Energy Transfer, and General Energy Analysis",
            "Forms of energy, energy transfer by heat and work, the first law of thermodynamics and energy conversion efficiencies.",
          ),
          ch(
            6,
            "The Second Law of Thermodynamics",
            "Heat engines, refrigerators and heat pumps, the Kelvin-Planck and Clausius statements, reversible processes and the Carnot cycle.",
          ),
          ch(
            7,
            "Entropy",
            "The increase of entropy principle, entropy change of pure substances, isentropic processes and isentropic efficiencies.",
          ),
        ],
      },
    ],
  },

  // Mathematics
  {
    title: "Introduction to Linear Algebra",
    authors: ["Gilbert Strang"],
    category: "linear-algebra",
    rack: "MA-01",
    tags: ["matrices"],
    description:
      "Linear algebra built on matrices and their four fundamental subspaces: elimination, orthogonality, determinants, eigenvalues and the singular value decomposition.",
    editions: [
      {
        isbn13: "9780980232776",
        editionNo: 5,
        publisher: "Wellesley-Cambridge Press",
        year: 2016,
        pages: 600,
        format: "HARDCOVER",
        totalChapters: 12,
        chapters: [
          ch(
            2,
            "Solving Linear Equations",
            "Vectors and linear equations, elimination, matrix operations, inverse matrices and LU factorisation.",
          ),
          ch(
            3,
            "Vector Spaces and Subspaces",
            "Spaces of vectors, the nullspace, rank, the complete solution to Ax = b, independence, basis and dimension.",
          ),
          ch(
            4,
            "Orthogonality",
            "Orthogonal subspaces, projections, least squares approximations, orthonormal bases and Gram-Schmidt.",
          ),
          ch(
            6,
            "Eigenvalues and Eigenvectors",
            "Eigenvalues, diagonalising a matrix, systems of differential equations, symmetric and positive definite matrices.",
          ),
          ch(
            7,
            "The Singular Value Decomposition (SVD)",
            "Bases and matrices in the SVD, principal component analysis and the geometry of the SVD.",
          ),
        ],
      },
    ],
  },
  {
    title: "Discrete Mathematics and Its Applications",
    authors: ["Kenneth H. Rosen"],
    category: "discrete-mathematics",
    rack: "MA-02",
    tags: ["logic", "graphs"],
    description:
      "Discrete mathematics for computing: logic and proofs, sets and functions, induction, counting, relations, graphs and trees.",
    editions: [
      {
        isbn13: "9780073383095",
        editionNo: 7,
        publisher: "McGraw-Hill Education",
        year: 2012,
        pages: 1072,
        format: "HARDCOVER",
        totalChapters: 13,
        chapters: [
          ch(
            1,
            "The Foundations: Logic and Proofs",
            "Propositional logic, predicates and quantifiers, rules of inference and methods of proof.",
          ),
          ch(
            9,
            "Relations",
            "Relations and their properties, n-ary relations and databases, closures, equivalence relations and partial orderings.",
          ),
        ],
      },
      {
        isbn13: "9781259676512",
        editionNo: 8,
        publisher: "McGraw-Hill Education",
        year: 2018,
        pages: 1120,
        format: "HARDCOVER",
        totalChapters: 13,
        chapters: [
          ch(
            1,
            "The Foundations: Logic and Proofs",
            "Propositional logic and equivalences, predicates and quantifiers, rules of inference and proof strategies.",
          ),
          ch(
            5,
            "Induction and Recursion",
            "Mathematical induction, strong induction, recursive definitions and structural induction, and recursive algorithms.",
          ),
          ch(
            6,
            "Counting",
            "The basics of counting, the pigeonhole principle, permutations and combinations, binomial coefficients and generalised permutations.",
          ),
          ch(
            9,
            "Relations",
            "Relations and their properties, n-ary relations and their use in relational databases, closures, equivalence relations and partial orders.",
          ),
          ch(
            10,
            "Graphs",
            "Graph terminology, representing graphs, isomorphism, connectivity, Euler and Hamilton paths, shortest paths and planar graphs.",
          ),
          ch(
            11,
            "Trees",
            "Introduction to trees, applications, tree traversal, spanning trees and minimum spanning trees.",
          ),
        ],
      },
    ],
  },
  {
    title: "Probability and Statistics for Engineering and the Sciences",
    authors: ["Jay L. Devore"],
    category: "probability-statistics",
    rack: "MA-03",
    description:
      "Applied probability and statistics: descriptive statistics, probability, distributions, sampling, estimation, hypothesis testing and regression.",
    editions: [
      {
        isbn13: "9780538733526",
        editionNo: 8,
        publisher: "Cengage Learning",
        year: 2012,
        pages: 687,
        format: "HARDCOVER",
        totalChapters: 16,
        chapters: [
          ch(
            2,
            "Probability",
            "Sample spaces and events, axioms of probability, counting techniques, conditional probability and independence.",
          ),
          ch(
            4,
            "Continuous Random Variables and Probability Distributions",
            "Probability density functions, expected values, the normal distribution and the exponential and gamma distributions.",
          ),
          ch(
            8,
            "Tests of Hypotheses Based on a Single Sample",
            "Hypotheses and test procedures, z and t tests about a mean, tests about a proportion and P-values.",
          ),
          ch(
            12,
            "Simple Linear Regression and Correlation",
            "The simple linear regression model, least squares estimation, inferences about the slope and the correlation coefficient.",
          ),
        ],
      },
    ],
  },
  {
    title: "Advanced Engineering Mathematics",
    authors: ["Erwin Kreyszig"],
    category: "engineering-mathematics",
    rack: "MA-04",
    description:
      "The mathematics engineers use: ordinary and partial differential equations, linear algebra, vector calculus, Fourier analysis, complex analysis and numerics.",
    editions: [
      {
        isbn13: "9780470458365",
        editionNo: 10,
        publisher: "Wiley",
        year: 2011,
        pages: 1283,
        format: "HARDCOVER",
        totalChapters: 25,
        chapters: [],
      },
    ],
  },
  {
    title: "Concrete Mathematics",
    subtitle: "A Foundation for Computer Science",
    authors: ["Ronald L. Graham", "Donald E. Knuth", "Oren Patashnik"],
    category: "discrete-mathematics",
    rack: "MA-02",
    description:
      "The mathematics behind the analysis of algorithms: sums, recurrences, integer functions, binomial coefficients, generating functions and asymptotics.",
    editions: [
      {
        isbn13: "9780201558029",
        editionNo: 2,
        publisher: "Addison-Wesley",
        year: 1994,
        pages: 657,
        format: "HARDCOVER",
        totalChapters: 9,
        chapters: [],
      },
    ],
  },

  // Management
  {
    title: "Principles of Marketing",
    authors: ["Philip Kotler", "Gary Armstrong"],
    category: "marketing",
    rack: "MG-01",
    description:
      "Creating customer value and engagement: the marketing environment, consumer behaviour, segmentation, products, pricing, channels and communications.",
    editions: [
      {
        isbn13: "9780134492513",
        editionNo: 17,
        publisher: "Pearson",
        year: 2017,
        pages: 736,
        totalChapters: 20,
        chapters: [],
      },
    ],
  },
  {
    title: "Management",
    authors: ["Stephen P. Robbins", "Mary Coulter"],
    category: "organisation",
    rack: "MG-02",
    description:
      "The functions of management: planning, organising, leading and controlling, with decision making, structure, motivation and change.",
    editions: [
      {
        isbn13: "9780134527604",
        editionNo: 14,
        publisher: "Pearson",
        year: 2017,
        pages: 752,
        totalChapters: 18,
        chapters: [],
      },
    ],
  },
];
