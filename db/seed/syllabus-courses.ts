/**
 * The 2026 B.Tech CSE syllabus (UG-CSE-2026): every computing and mathematics
 * course with its units, hours and prescribed books. Unit text is the
 * syllabus's own; it is what semantic mapping matches chapters against.
 * Generated from the published syllabus and reviewed by hand.
 */

import type { CourseSeed } from "./academic-data";

export type SyllabusCourseSeed = CourseSeed & {
  elective: boolean;
  /** ISBN-13 of any edition of each book, textbooks first. */
  textbooks: string[];
  references: string[];
};

export const SYLLABUS_COURSES: SyllabusCourseSeed[] = [
  {
    code: "UE26CS151A",
    title: "Python For Computational Problem Solving",
    dept: "CSE",
    semester: 1,
    credits: 5,
    elective: false,
    endSemInDays: 14,
    description:
      "Problem solving in Python, from expressions, control flow and collections to functions, functional programming, testing and object-oriented design.",
    textbooks: ["9781098155438", "9781718504509"],
    references: ["9781492056355"],
    units: [
      {
        title: "Introduction to python and collections",
        hours: 14,
        topics:
          "Block diagram of Computer, Computer Hardware & Software: Application Software, System Software, Operating System, Syntax, semantics and program translation, algorithm. Introduction to Python Programming Language, IDLE Python Development Environment, Output function, variables, types and id, input function, operators and expressions, Control structures, Strings, Lists",
      },
      {
        title: "Collections & Functions",
        hours: 14,
        topics:
          "Tuples, Sets, Dictionaries, File handling - Reading and writing files: Text, CSV and JSON. Functions: Definition, call, Positional and keyword parameter, Default parameters, Variable number of arguments",
      },
      {
        title: "Functions, Functional Programming and Modules",
        hours: 14,
        topics:
          "Recursion, Call-backs, Lambda function, Map, filter, and reduce, max, min, Zip, list comprehension,Closure, Decorators, generators, Introduction to modules - Numpy, matplotlib, Pillow / PIL,argparse,re. 14 hours",
      },
      {
        title: "Testing,Debugging and Object Oriented Programming",
        hours: 14,
        topics:
          "Testing- Pytest, Function testing with Doctest, pdb debugger commands, Virtual environments and pip package management. Classes and objects - inheritance, polymorphism, iterators & generators, Error handling & Exceptions - try, except and raise, exception propagation",
      },
    ],
  },
  {
    code: "UE26CS151B",
    title: "Problem Solving with C",
    dept: "CSE",
    semester: 2,
    credits: 5,
    elective: false,
    endSemInDays: 21,
    description:
      "The Problem Solving with C course introduces students to fundamental techniques for solving Common computational problems. Students will learn to analyse problem statements, design appropriate algorithms, and implement efficient solutions. Emphasis is placed on using C language constructs to develop well-structured and maintainable programs, thereby laying a strong foundation in both problem- solving and programming skills",
    textbooks: ["9780131103627"],
    references: ["9788131705629", "9780393979503", "9781292437071"],
    units: [
      {
        title: "Problem Solving Fundamentals",
        hours: 14,
        topics:
          "Introduction, Salient Features of 'C', Program Structure, Variables, Data Types & arrange of values,Qualifiers, Operators and Expressions, Control Structures, Input/Output Functions, Language Specifications -Behaviors, Single character input and output, Guidelines and CERT C Coding standards of variables, comments and readability of code",
      },
      {
        title: "Arrays and Functions",
        hours: 14,
        topics:
          "Arrays-1D and 2D, Bound Checking with Arrays, Pointer and Pointer Arithmetic, Pointer to an array and Array of pointers, Functions, Recursion, Call back, Storage classes, Recursion, Searching, Sorting, Strings, String Manipulation Functions & Error handling, Command line arguments",
      },
      {
        title: "Dynamic Memory Management and User-Defined Types",
        hours: 14,
        topics:
          "Dynamic Memory Management functions & Error handling, Structures, #pragma, Array of Structures, Pointer to structures, Passing Structure and Array of structure to a function, Bit fields, Unions, Enums, Lists, Stack, Queue, Priority Queue",
      },
      {
        title: "File Handling and Portable Programming",
        hours: 14,
        topics:
          "File IO using redirection, File Handling functions of C, Searching and Sorting using Opaque Pointers, Variable Length Arguments, Environment variables, Preprocessor Directives, Header Guards and Conditional Compilation",
      },
    ],
  },
  {
    code: "UE25CS251A",
    title: "Digital Logic and Computer Design",
    dept: "CSE",
    semester: 3,
    credits: 5,
    elective: false,
    endSemInDays: 28,
    description:
      "Combinational and sequential logic design, digital building blocks, instruction set architecture and the microarchitecture of a simple processor.",
    textbooks: ["9780123944245", "9780132774208"],
    references: [],
    units: [
      {
        title: "Combinational and Sequential Logic Design",
        hours: 14,
        topics:
          "Introduction, Boolean Equations, Karnaugh maps, Combinational building Blocks. Introduction, Latches and Flip-Flops, Synchronous Logic Design",
      },
      {
        title: "Digital Building Blocks",
        hours: 14,
        topics: "Finite state Machines,Introduction, Arithmetic Circuits, Number Systems",
      },
      {
        title: "Architecture Sequential Building Blocks, Memory Arrays",
        hours: 14,
        topics:
          "Introduction, Assembly Language, Machine Language, Programming, Addressing Modes, Compiling, Assembling and Loading, Parallelism",
      },
      {
        title: "Microarchitecture",
        hours: 14,
        topics:
          "Introduction, Performance Analysis, Single-Cycle Processor, Multicycle Processor, Pipelined Processor",
      },
    ],
  },
  {
    code: "UE25CS252A",
    title: "Data Structures and its Applications",
    dept: "CSE",
    semester: 3,
    credits: 5,
    elective: false,
    endSemInDays: 35,
    description:
      "Linked lists, stacks, queues, trees, graphs, tries, suffix trees and hashing, implemented in C and applied to practical problems.",
    textbooks: ["9788120311770"],
    references: ["9780262046305"],
    units: [
      {
        title: "Linked List and Stacks",
        hours: 16,
        topics:
          "Review of Structures, Pointers, Static and Dynamic Memory Allocation in C. Linked List: Single, Double, Circular (All insert, delete, other operations and applications). Multilist: Introduction to sparse matrix. Skip list. Case study: Representation of Polynomial expression & its operations. Stack: Introduction & implementation of a Stack using Arrays & Linked list. Applications of Stack: Execution of functions, Recursion, Conversion & Evaluation of an expression: Infix to postfix, Infix to prefix, Matching of Parenthesis",
      },
      {
        title: "Queues and Trees",
        hours: 12,
        topics:
          "Queues: Simple Queue, Circular Queue, Priority Queue, Double Ended Queue and their implementation using Arrays and Linked List. Applications of Queue: Case Study - Josephus problem, CPU scheduling. Trees: N-ary trees, Binary Trees, Binary Search Trees (BST) and Forest: definition, properties, conversion of an N-ary tree and a Forest to a binary tree. Traversal of trees: Preorder, Inorder and Postorder",
      },
      {
        title: "Application of Trees and Introduction to Graphs",
        hours: 14,
        topics:
          "Implementation of Binary Search Tree using arrays and dynamic allocation(Insert, delete, traversals and other operations and applications), Expression Tree, Threaded Binary Search Tree, Heap using arrays, Priority Queue using heap ( min and max heap). Balanced Trees: AVL Trees, Splay Tree. Graphs: Properties, Representation & Implementation of graphs - Adjacency matrix, Adjacency list. Graph traversal methods: Depth first search, Breadth first search techniques",
      },
      {
        title: "Applications of Graphs, Suffix Tree and Hashing",
        hours: 14,
        topics:
          "Applications of BFS & DFS: Connectivity of graph, finding the number of Connected Components, finding path in a network. Trie Trees: Implementation (insert, delete and search operations), Construction of suffix trie and tree. Hashing: Hash function, Hash table, Collision Handling: Implementation (Insert, Delete and other operations) of Separate Chaining, Linear, Quadratic Probing, Double Hashing and Rehashing",
      },
    ],
  },
  {
    code: "UE25MA242A",
    title: "Mathematical Foundation for AI & Data Science",
    dept: "MATH",
    semester: 3,
    credits: 4,
    elective: false,
    endSemInDays: 42,
    description:
      "Linear systems, matrix decompositions, probability and hypothesis testing with regression, as the mathematics behind AI and data science.",
    textbooks: ["9788131501726", "9781259717604", "9780321982384"],
    references: [],
    units: [
      {
        title: "Linear Systems and Structural Foundations",
        hours: 14,
        topics:
          "Introduction to Linear Systems: Systems of Linear Equations, Gaussian Elimination, LU Decomposition, Matrix Rank, Consistency of Systems. Inverse of a Matrix-Gauss Jordon Vector Spaces: Vector Spaces and Subspaces, Four fundamental subspaces, Linear Independence, Basis, Dimension., Linear Transformation",
      },
      {
        title: "Matrix Decomposition",
        hours: 14,
        topics:
          "Vector Operation and Matrix decomposition: Dot Product, Vector Norms, Orthogonality, Gram Schmidt process, Orthogonal Projections, Least Squares Approximation. Eigen Concepts: Eigenvalues, Eigenvectors, Diagonalization of Matrices. Covariance and Positive Definite Matrices: Covariance Matrix, Positive Definite Matrices, Tests for Definiteness. Singular Value Decomposition: Singular Value Decomposition (SVD) Principal Component Analysis: PCA, Feature Extraction, Dimensionality Reduction",
      },
      {
        title: "Hypothesis Testing and Simple Linear Regression",
        hours: 14,
        topics:
          "Hypothesis Testing: Introduction, Large-Sample tests for a Population Mean, Drawing conclusions from the results of Hypothesis tests, the relationship between confidence interval and hypothesis tests, Small-Sample Tests for a Population Mean, ANOVA, Chi-squared Test, Fixed Level Testing, Type I and Type II Errors, Power of a Test, Factors Affecting Power of a Test",
      },
    ],
  },
  {
    code: "UE25CS242A",
    title: "Operating Systems",
    dept: "CSE",
    semester: 3,
    credits: 4,
    elective: false,
    endSemInDays: 49,
    description:
      "This course focuses on fundamental operating systems concepts including various algorithms and trade-offs for efficient management of resources such as CPU, Memory, Storage and I/ O. This course requires the student to have a desirable knowledge of Data Structures and its Applications",
    textbooks: ["9781119320913", "9780321638007"],
    references: ["9780133591620", "9781985086593"],
    units: [
      {
        title: "Introduction and Process Management",
        hours: 14,
        topics:
          "What Operating Systems Do, Computer-System Organization, Computer-System Architecture, Operating-System Structure & Operations, Operating-System Services; Process Concept: Process in Memory, Process State, Process Control Block (PCB), Process Creation and Termination, System Calls for Process Management, Life Cycle of I/O Requests. CPU Scheduling: Basic Concepts, Scheduling Criteria, Scheduling Algorithms: First-Come First-Served (FCFS), Shortest-Job-First (SJF), Priority Scheduling, Round-Robin Scheduling, Multilevel Queue Scheduling, Multilevel Feedback Queue Scheduling; Introduction to Shell Programming: Variables, Control Flow, Shell Scripts, Scheduler - cron",
      },
      {
        title: "IPC, Threads and Concurrency",
        hours: 14,
        topics:
          "IPC: Shared Memory, Message Passing, Pipes - Named and Ordinary, System Calls for Shared Memory, Pipes and FIFOs, Linux Domain Sockets; Introduction to Threads, Types of Threads, Multicore Programming, Multithreading Models, Thread Control Block (TCB), Thread Creation, Thread Scheduling, Thread Libraries, POSIX Threads (Pthreads); Multicore Kernel Concepts: Symmetric Multiprocessing (SMP), Kernel Parallelism, CPU Affinity, Load Balancing, Multicore Scheduling; Mutual Exclusion and Synchronization: Software Approaches, Principles of Concurrency, Hardware Support, Mutex Locks, Semaphores; Scalable Synchronization: Spinlocks, Reader-Writer Locks, Lock Contention; Classic Synchronization Problems; Deadlocks: Principles of Deadlock, Deadlock Characterization, Deadlock Avoidance; Signals and Signal Handling",
      },
      {
        title: "Memory Management",
        hours: 14,
        topics:
          "Main Memory: Hardware and Control Structures, OS Support, Address Translation, Dynamic Loading, Dynamic Linking and Shared Libraries, Memory-Mapped Files and mmap(), Swapping, Fragmentation, Segmentation, Paging, Structure of Page Tables, Translation Lookaside Buffer (TLB), TLB Hits and Misses, Effective Access Time (EAT); Virtual Memory - Demand Paging, Page-Fault Handling, Copy-on-Write, Page Replacement, Allocation of Frames, Thrashing, NUMA (Non-Uniform Memory Access) Basics and Memory Locality, Clock Page Replacement",
      },
      {
        title: "File Management, Storage Management and Security",
        hours: 14,
        topics:
          "File Concept, Access Methods, Directory, Driver Development, Flash Drives, File-System sharing, File system protection, System calls to retrieve file attributes, file types, file operations, reading directories, File system implementation, Directory implementation, allocation methods, Free-Space Management, Efficiency and Performance, Mass storage structure, Disk Structure, Disk scheduling, Disk Management, RAID Structure, OS Security, Access Matrix, Implementation of the Access Matrix, Access Control, Revocation of Access Rights; Shell programming - awk, sed",
      },
    ],
  },
  {
    code: "UE25CS243A",
    title: "Computer Networks",
    dept: "CSE",
    semester: 3,
    credits: 4,
    elective: false,
    endSemInDays: 14,
    description:
      "Computer networks layer by layer: the internet and application protocols, transport with UDP and TCP, network layer routing and IP, and link-layer LANs.",
    textbooks: ["9780133594140"],
    references: ["9780132126953"],
    units: [
      {
        title: "Computer Networks and the Internet, Application Layer",
        hours: 14,
        topics:
          "Introduction to Computer Networks, Internet: A Nuts-and-Bolts Description, A Services Description, Protocol, The Network Edge: Access Networks, Physical Media, Introduction to physical layer devices, The Network Core, Packet Switching, Circuit Switching, A Network of Networks, Delay, Loss, and Throughput in Packet-Switched Networks, Overview of Delay in Packet Switched Networks - Queuing Delay and Packet Loss, End-to-End Delay, Throughput in Computer Networks, The OSI Model and the TCP/IP Protocol Suite, Protocol Layers, The OSI Model, TCP/IP Protocol Suite. Network Application Principles: Network Application Architectures, Processes Communication, Transport Services available to Applications, Transport Services provided by Internet. The Web, HTTP and HTTPS, Non persistent and persistent connection, HTTP Message Format, TLS 1.3, User Server Interaction: Cookies, Web Caching",
      },
      {
        title: "Application Layer, Transport Layer - UDP, TCP",
        hours: 14,
        topics:
          "Domain Name Server (DNS), The Internet's Directory Service: Services provided by DNS; How DNS works: DNS Records and messages; Peer to peer Applications - Overview; Socket Programming with TCP and UDP; Other Application Layer Protocols: FTP, SMTP, SNMP, Telnet, SSH. Introduction to Transport Layer Services: Relationship Between Transport and Network Layer, Overview of the Transport layer on the Internet, Multiplexing and Demultiplexing; Connectionless Transport UDP: UDP Segment Structure, UDP Checksum. Overview of Principles of Reliable Data Transfer, Go-Back-N Protocol, Selective-Repeat; Connection Oriented Transport TCP: TCP Segment Structure, Flow Control, TCP Connection Management",
      },
      {
        title: "Transport Layer - TCP, Network Layer and Internet Protocol",
        hours: 14,
        topics:
          "TCP Congestion Control. Numerical on TCP congestion control mechanisms-TCP Tahoe, Reno, QUIC Protocol - with HTTP3 Overview of Network Layer: Forwarding and routing, what's Inside a Router?, The Internet Protocol (IP) IPV4: Datagram Format, Fragmentation, Addressing, NAT, Introduction to SDN, Components and Architecture of SDN, OpenFlow and P4, Data Center Networking - Modern Clos/Fat-tree vs Traditional 3- Tier, Multicast Routing - Case Study",
      },
      {
        title: "Network Layer and Internet Protocol, Link Layer and LAN",
        hours: 14,
        topics:
          "Introduction to Network layer Protocols: DHCP, ICMP; IPv6 Protocol: Packet Format, Transition from IPv4 to IPv6; Introduction to Routing Algorithms: Link State: Dijkstra's algorithm and Distance Vector: Bellman- Ford Algorithm. Link layer - Error-Detection and Correction techniques, Parity checks, Internet Checksum, Cyclic Redundancy Check, and Multiple Access Protocols: CSMA/CD; Switched LAN: Link layer addressing and ARP, Ethernet: Link-layer switching, VLAN. Retrospective: A Day in the Life of a Web Page Request. Physical Layer - Purpose, Signals to Packets, Transmission media. Wireless LANs: IEEE 802.11 LAN architecture",
      },
    ],
  },
  {
    code: "UE26MA101A",
    title: "Bridge Course for Engineering Mathematics I",
    dept: "MATH",
    semester: 1,
    credits: 4,
    elective: false,
    endSemInDays: 21,
    description:
      "This course intends to provide a foundation for acquiring Mathematical skills. Comprehensive coverage at an introductory level is given via concepts such as Partial Differentiation, Ordinary Differential Equations, Partial Differential Equations, and Special Functions",
    textbooks: ["9788174091956"],
    references: ["9781842658468", "9780470458365"],
    units: [
      {
        title: "Random Variables and Probability Distributions",
        hours: 7,
        topics:
          "Random Variables, Types, Expectation and Variance, Discrete Probability Distributions (Bernoulli, Binomial and Poisson), Continuous Distributions (Exponential and Normal)",
      },
      {
        title: "Partial Differentiation",
        hours: 7,
        topics:
          "Introduction to Partial differentiation, Geometrical Interpretation, Total Derivative, Chain rule, Partial Differentiation of Composite and Implicit functions, Homogeneous functionsand Euler's Theorem, Taylor's & Maclaurin's Series expansion for a function of two variables",
      },
      {
        title: "Differential Equations - I",
        hours: 7,
        topics:
          "Bernoulli's Differential Equations, Exact differential equations, Reducible to exact form, Orthogonal trajectories (Cartesian and polar forms), Solutions to higher order linear differential equations with constant coefficients - Complementary function and Particular integrals of standard functions",
      },
      {
        title: "Differential Equations - II",
        hours: 7,
        topics:
          "Method of Variation of Parameters, Solution of Partial Differential Equations by direct method, Linear partial differential equations of the first order, Lagrange's Linear Equation, Solution of PDE by the method of Separation of Variables",
      },
    ],
  },
  {
    code: "UE25CS251B",
    title: "Microprocessor and Computer Architecture",
    dept: "CSE",
    semester: 4,
    credits: 5,
    elective: false,
    endSemInDays: 28,
    description:
      "Modern computing demands a deep understanding of how hardware and software co-evolve. This course explores computer architecture through the lens of the open-standard RISC-V instruction set, offering students a rigorous foundation in processor design, arithmetic logic, memory systems, and I/O organization. Spanning instruction-level programming to cache hierarchies and multiprocessor coherence, learners will bridge theoretical principles with practical hardware behavior.",
    textbooks: ["9780128122754"],
    references: ["9780128119051"],
    units: [
      {
        title: "RISC-V Instruction Set Architecture",
        hours: 14,
        topics:
          "Introduction to RISC-V ISA: History, design principles, and comparison with CISC (x86), RISC-V Instruction Formats, Integer Arithmetic Instructions, Data Transfer Instructions, memory addressing, Control Flow Instructions, RISC-V Register File: 32 general-purpose registers, ABI calling conventions, pseudo- instructions, Procedure Calls: Stack frame, caller/callee-saved registers, leaf and non-leaf procedures",
      },
      {
        title: "Arithmetic for Computers",
        hours: 14,
        topics:
          "Multiplication: Booth's algorithm, hardware multiplier, Division: Restoring and non-restoring algorithms, hardware divider, IEEE 754 single and double precision, special values, Floating-Point Arithmetic: Addition, subtraction, multiplication, rounding modes, RISC-V Floating-Point Extension (RV32F/RV64F/RV64D): FP registers, FP instructions, RISC-V M Extension: MUL, MULH, DIV, REM and their unsigned variants, Parallelism and Arithmetic: SIMD, subword parallelism concepts",
      },
      {
        title: "Pipelining",
        hours: 14,
        topics:
          "Introduction to Pipelining: Five-stage pipeline, pipeline registers, throughput improvement, Pipeline Hazards: Structural hazards, data hazards (RAW, WAW, WAR), control hazards, Forwarding / Bypassing and Stalling: Hazard detection unit, forwarding paths, Branch Prediction: Static prediction, dynamic prediction (1-bit, 2-bit predictors), BTB",
      },
      {
        title: "Memory Hierarchy and I/O Systems",
        hours: 14,
        topics:
          "Memory Hierarchy Overview: Temporal and spatial locality, memory technologies, Cache Memory: Direct- mapped, set-associative, and fully-associative caches, Cache Performance: Miss rate, hit time, miss penalty, AMAT formula, Cache Write Policies: Write-back, write-through, write-allocate, no-write-allocate, Cache Optimization: Multi-level Caches and Virtual Memory: L1/L2/L3 hierarchy, TLB, page tables, Main Memory and DRAM: SDRAM, DDR, bandwidth and latency considerations, Storage: HDD, SSD, flash memory, RAID levels overview, /O Subsystems: Buses, programmed I/O, interrupt-driven I/O, DMA, Multiprocessors: SMP, cache coherence (MESI protocol), memory consistency",
      },
    ],
  },
  {
    code: "UE25CS252B",
    title: "Machine Learning",
    dept: "CSE",
    semester: 4,
    credits: 5,
    elective: false,
    endSemInDays: 35,
    description:
      "Machine Learning has become a core technology behind applications such as recommendation systems, virtual assistants, autonomous vehicles, fraud detection, and intelligent search engines. This course introduces the fundamental concepts and algorithms of Machine Learning, including Decision Trees, KNN, SVM, Bayesian Learning, clustering, neural networks, introductory deep learning, Reinforcement Learning, and MLOps. The course aims to provide students with both theoretical foundations and practical understanding of modern ML techniques used in intelligent systems.",
    textbooks: ["9780071154673", "9780262358064", "9781098107963"],
    references: ["9781107422223", "9780387310732"],
    units: [
      {
        title: "Introduction, Performance Metrics, Classification with Decision trees and KNN",
        hours: 14,
        topics:
          "Introduction to ML: Machine Learning and its Models, Concept Learning: Concepts of Hypotheses, Version space, inductive bias, Performance metrics: Accuracy, Precision, Recall, Sensitivity, Specificity, AUC, ROC, Bias-Variance decomposition, Bias Variance trade-off, Cross validation strategies, Decision Trees: Basic algorithm(ID3) for classification, Decision boundary for Decision Trees(x-y axis), Hypothesis search and Inductive bias, Issues in Decision Tree Learning - Over fitting, Solutions to over fitting, dealing with continuous values, Logistic Regression, Instance-based learning: k-nearest neighbor learning (Classification & Regression), Decision boundary for KNN",
      },
      {
        title: "Artificial Neural Networks (ANN), Support Vector Machines (SVM), Boosting",
        hours: 14,
        topics:
          "Artificial Neural Networks: Introduction, Perceptrons, Multi-layer networks and Back-propagation, Activation functions (Step, Sigmoid, Tanh, ReLU), Various Optimizers (GD, SGD, Momentum-based, Adagrad, Adam) Support Vector Machines - Margin and maximization, SVM - The primal problem, the Lagrangian dual, SVM - Solution to the Lagrangian dual, (Hard Margin and Soft Margin, Classification ONLY), Kernel Functions:Linear, Polynomial (Derivation only for linear function).Combining weak learners, improving performance with Gradient Boost, Random Forest",
      },
      {
        title: "Bayesian Learning, HMM and Unsupervised Learning",
        hours: 14,
        topics:
          "Bayesian Learning -Bayes theorem, Maximum likelihood, Bayes optimal classifier, Naïve Bayes Classifier, Expectation maximization and Gaussian Mixture Models. Hidden Markov Models (HMMs), Hierarchical vs. non-hierarchical clustering, Agglomerative and divisive clustering, K-means clustering, Bisecting K- means, K-Means as special case of Expectation Maximization",
      },
      {
        title: "Ml deployment and advanced learning paradigms",
        hours: 14,
        topics:
          "Introduction to Reinforcement Learning: agent, environment, states, actions, rewards, policy, value functions, Bellman equation, and Q-learning fundamentals., Introduction to Deep Learning, Introduction to Convolution operation and Convolution Neural Network (CNNs). (Parameter calculation, Max pooling, Avg pooling). Hyper parameter tuning methods: Grid Search, Random Search, Bayesian Optimization, Introduction to MLOps: MLOps Overview, ML Lifecycle & Production Challenges, Data & Feature Pipelines, Experiment Tracking & Model Versioning, Model Deployment & Serving, CI/CD/CT for ML Systems, Inference Systems, Monitoring, Drift & Observability, ML Orchestration",
      },
    ],
  },
  {
    code: "UE25CS241B",
    title: "Design and Analysis of Algorithms",
    dept: "CSE",
    semester: 4,
    credits: 4,
    elective: false,
    endSemInDays: 42,
    description:
      "In the evolving landscape of computing, algorithms form the backbone of every efficient solution-from simple searching tasks to complex decision-making systems. The course Design and Analysis of Algorithms introduces students to the art and science of crafting efficient, scalable, and elegant solutions to computational problems. At its core, this course emphasizes not just how to solve a problem, but how efficiently it can be solved.",
    textbooks: ["9780132316811"],
    references: ["9780262046305"],
    units: [
      {
        title: "Introduction and Brute Force",
        hours: 14,
        topics:
          "Algorithms: Fundamentals of Algorithmic Problem Solving, Important Problem Types. Analysis of Algorithm Efficiency: Analysis Framework, Asymptotic Notations and Basic Efficiency Classes, Mathematical Analysis of Non-Recursive and Recursive Algorithms. Brute Force: Selection Sort, Bubble Sort, Sequential Search, Brute Force String Matching, Exhaustive Search",
      },
      {
        title: "Decrease - and - Conquer & Divide-and-Conquer",
        hours: 14,
        topics:
          "Decrease-and-Conquer: Decrease by constant number algorithms - Insertion Sort, Topological Sorting, Algorithms for Generating Combinatorial Objects, Decrease-by-a-Constant-Factor Algorithms - Fake Coin Problem, Russian Peasant Multiplication, Josephus problem, Decrease-by-Variable-Size Algorithms - Computing a median and the selection problem. Divide-and-Conquer: Master Theorem, Merge Sort, Quick Sort, Binary Search, Binary Tree Traversals, Complexity analysis for finding the height of BST, Multiplication of Large Integers, Strassen's Matrix Multiplication",
      },
      {
        title: "Transform-and-Conquer Space and Time Tradeoffs & Greedy Technique",
        hours: 14,
        topics:
          "Transform and Conquer: Pre-sorting, Heap Sort, Red-Black Tree Construction and Time complexity Analysis for insert and search operation, 2-3 Trees and B Tree: insertion, deletion, searching, and time complexity analysis. Space and Time Tradeoffs: Sorting by Counting, Input Enhancement in String Matching - Horspool's and Boyer-Moore Algorithms. Greedy Technique: Prim's Algorithm, Kruskal's Algorithm and union-find algorithm, Dijkstra's Algorithm, Huffman Trees",
      },
      {
        title: "Limitations, Coping with the Limitations of Algorithm Power & Dynamic Programming",
        hours: 14,
        topics:
          "Dynamic Programming: Computing a Binomial Coefficient, The Knapsack Problem and Memory Functions, Warshall's and Floyd's Algorithms. Limitations of Algorithm Power: Lower-Bound Arguments, Decision Trees, P, NP, and NPComplete, NP-Hard Problems. Coping with the Limitations of Algorithm Power: Backtracking, Branch and Bound",
      },
    ],
  },
  {
    code: "UE25CS242B",
    title: "Cybersecurity Essentials",
    dept: "CSE",
    semester: 4,
    credits: 4,
    elective: false,
    endSemInDays: 49,
    description:
      "Security principles, web vulnerabilities, cyber law and data privacy, and the use and security of AI.",
    textbooks: ["9781733003902", "9783030303709", "9781498721042"],
    references: [],
    units: [
      {
        title: "Introduction to Cybersecurity",
        hours: 14,
        topics:
          "Introduction: CIA principles, Vulnerability, Threat and Risk, Anatomy of an Attack, Attack Landscape, Real-life Cyber-attacks, Security vs. Privacy, Security Cornerstones, Cyber security Framework, Security Mindset, Security Policy and Culture, Security Pillars, Security Principles, Defense in depth, Cyber security best practices: Strong password, Social engineering techniques. Basics of Network Security: NAT, Socket Programming using python, Packet Construction inside kernel, packet sending tools (netcat, telnet, ssh, /dev/tcp, /dev/udp, ping). Packet Sniffing and Spoofing: Network Interface Card (NIC), Sniffing and spoofing using Scapy",
      },
      {
        title: "Web Vulnerabilities",
        hours: 14,
        topics:
          "Web basics - Browser-Server Communication Model, HTTP vs HTTPS, GET vs POST methods (security implications), Cookies & Session Management, OWASP Top 10, MITRE Att&ck Framework, Cross-Site Request Forgery (CSRF - concept), Cross-Site Scripting (XSS - concept), SQL Injection (concept & prevention). Introduction to CTF",
      },
      {
        title: "Cyber Law & Data Privacy",
        hours: 14,
        topics:
          "Cyber Laws in digital age: impacts, risks, X-Border Data Flow, Cyber Crimes - What is it, types of crimes, Behavioral Aspects (Technology intoxication), Cyber Crimes against Individuals, Institution and State, Cyber terrorism, Cyber Warfare issues and legal challenges. Discuss and compare regulations like Indian IT Act GDPR, PDPA, CCPA, DPDPA 2023 etc. Legal Provisions to handle Cyber Crimes, Cyber Law and Compliance issues in Industry, International Approach to regulate cyberspace. Data privacy: Fundamentals of Data Privacy, Data Classification, Privacy eco-system, Privacy evolution in today's context, trends, driving factors and its Global importance, The Data Life Cycle, Privacy Principles and Framework, Privacy in Digital Age, Privacy Risks (what, how to identify, when). Case Study",
      },
      {
        title: "AI Security",
        hours: 14,
        topics:
          "Applications of AI in Cyber Security, AI Capabilities - Understanding current AI technological abilities, Scope and limitations of modern AI systems, AI Risks and X-Risks - Analysis of long-term AI development trajectories. Bias and Stereotypes, Handling unexpected inputs and scenarios. Adversarial ML Taxonomy and attacks (Prompt injection, Model misuse risks, Data poisoning (basic idea))",
      },
    ],
  },
  {
    code: "UE25CS243B",
    title: "Full Stack Development - Theory and Practice",
    dept: "CSE",
    semester: 4,
    credits: 4,
    elective: false,
    endSemInDays: 14,
    description:
      "Full-stack web development: relational and NoSQL databases, web fundamentals, React and backend services with database integration.",
    textbooks: ["9780078022159", "9781492053514", "9781839215414"],
    references: ["9780072465631"],
    units: [
      {
        title: "Introduction to Full stack and Database Concepts",
        hours: 14,
        topics:
          "Web architecture: Introduction, Web Application Architectures (3-tier) and the technology stacks. Introduction to databases: Purpose and advantages of DBMS, database application architecture. Data modeling: Entity-Relationship model, ER diagrams, mapping ER to relational schemas. SQL basics: Data types, DDL (CREATE, ALTER, DROP), DML (SELECT, INSERT, UPDATE, DELETE), constraints and keys. Intermediate SQL: Multi-table joins (inner, left, right), aggregate functions, GROUP BY and HAVING 14 hours",
      },
      {
        title: "Advanced DBMS and NoSQL Databases",
        hours: 14,
        topics:
          "Advanced Database: Sub-queries and Correlated queries, Triggers, Functions and Procedures. Normalisation: Functional dependencies, 1NF, 2NF, 3NF - identifying and resolving anomalies. Introduction to NoSQL: NoSQL vs relational databases, key-value stores, document stores - when to use what. NoSQL DB Types: Types of NoSQL DB - Graph databases, Vector Databases, Time Series Databases. MongoDB basics: Documents and collections, CRUD operations. 14 hours",
      },
      {
        title: "Web Fundamentals and React",
        hours: 14,
        topics:
          "HTML5 and CSS3: HTML Semantic elements, forms and inputs, CSS. JavaScript essentials: Built-in objects, DOM manipulation, Events. Async JavaScript: Callbacks, promises, async/await; consuming REST APIs with Axios, JSON syntax, working with JSON in JavaScript. Introduction to React: React installation (Vite), JSX, Functional components, props, state with useState. React hooks: useEffect for side effects and data fetching, React Router for navigation 14 hours",
      },
      {
        title: "Advanced React, Backend and Database Integration",
        hours: 14,
        topics:
          'React forms and event handling: Controlled components, form validation, passing state and handlers from parent to child components. Express.js: Web service concepts, REST API design, routing, middleware, error handling, Drivers for SQL and MongoDB connectivity. Full stack integration: Connecting React frontend to Express backend via REST APIs, handling CORS, environment configuration 14 hours 1. "Database System Concepts", Silberschatz, H Korth and S Sudarshan, McGrawHill, 7th Edition, 2019. 2. "Web Development with Node and Express" by Ethan Brown, O\'Reilly, 2nd ed., 2019/2020 3. "Full-Stack React Projects" by Shama Hoque, Packt, 2nd ed., 2020 1. Database Management Systems, R Ramakrishnan, J Gehrke, 3rd Edition, McGraw Hill, 2002. 2. "Node.js Design Patterns" by Casciaro & Mammino, Packt, 4th ed., 2025 3. "Learning React, Functional Web Development with React and Redux", Alex Banks and Eve Porcello, O\'Reilly Media, 2nd Edition, 2020 4. "An Introduction to Database Systems" by C. J. Date, Pearson Education, 8th Edition, 2003 Explain the three-tier web application model, design entity-relationship diagrams for real-world data scenarios, map them to relational schemas, and write SQL queries using DDL, DML, multi-table joins, and aggregate functions. Write advanced SQL using subqueries, correlated queries, triggers, and stored procedures; apply normalisation up to 3NF to resolve data anomalies; and perform CRUD operations in MongoDB, articulating when a NoSQL store is preferable to a relational database. Build semantic, interactive web pages with HTML5 and CSS3; manipulate the DOM and handle events with JavaScript; use async/await and Axios to consume REST APIs; and develop React applications with functional components, props, state, useEffect, and React Router. Design and implement controlled React forms with validation; build RESTful Express.js APIs with structured routing, middleware, and SQL/MongoDB drivers; and integrate a React frontend with a Node.js/Express backend - managing CORS and environment configuration - to deliver a working, full stack web application',
      },
    ],
  },
  {
    code: "UE24CS351A",
    title: "Database Management Systems",
    dept: "CSE",
    semester: 5,
    credits: 5,
    elective: false,
    endSemInDays: 7,
    description:
      "Relational algebra, SQL, query processing, functional dependencies and normal forms, transactions and concurrency, and NoSQL, graph and vector databases.",
    textbooks: ["9780133970777", "9780078022159"],
    references: ["9780072465631", "9781558606227", "9780321197849"],
    units: [
      {
        title: "Introduction to Database Management and SQL",
        hours: 14,
        topics:
          "Purpose, View of data, Database design- Introduction to databases, Database application architecture, E-R Model, reducing ER to a relational schema. Relational operations (Algebra), Unary Operations - Unity, Binary, Aggregate Functions, Grouping, SQL overview, Data definition, Structure of SQL queries, constraints and keys",
      },
      {
        title: "Advanced SQL in Database Design",
        hours: 14,
        topics:
          "Database Modification, Basic Operations, Set Operations, Null Values, Aggregate Functions, Nested Subqueries, Corelated queries, Join expressions, Views, Triggers, Functions, Procedures, CTE, windows functions and full text search functions",
      },
      {
        title: "Design Concepts and Implementation",
        hours: 14,
        topics:
          "Introduction to strategies of Query processing and Query optimization, Functional Dependencies, Inference Rules, Normal Forms Based on Primary Keys (1NF, 2NF, and 3NF), General Definitions of Second and Third Normal Forms, Boyce-Codd Normal Form, Higher Normal Forms",
      },
      {
        title: "Next-Gen Data Management",
        hours: 14,
        topics:
          "Database transactions, Concurrency control, Locking, Introduction to NoSQL databases, Key-value database, Graph databases (Neo4j), Introduction to Vector databases, Vector search with Relational and NOSQL databases. Web Application development using Next.js and SQL",
      },
    ],
  },
  {
    code: "UE24CS352A",
    title: "Machine Learning",
    dept: "CSE",
    semester: 5,
    credits: 5,
    elective: false,
    endSemInDays: 28,
    description:
      "Machine Learning has become a core technology behind applications such as recommendation systems, virtual assistants, autonomous vehicles, fraud detection, and intelligent search engines. This course introduces the fundamental concepts and algorithms of Machine Learning, including Decision Trees, KNN, SVM, Bayesian Learning, clustering, neural networks, introductory deep learning, Reinforcement Learning, and MLOps. The course aims to provide students with both theoretical foundations and practical understanding of modern ML techniques used in intelligent systems.",
    textbooks: ["9780071154673", "9780262358064", "9781098107963"],
    references: ["9781107422223", "9780387310732"],
    units: [
      {
        title: "Introduction, Performance Metrics, Classification with Decision trees and KNN",
        hours: 14,
        topics:
          "Introduction to ML: Machine Learning and its Models, Concept Learning: Concepts of Hypotheses, Version space, inductive bias, Performance metrics: Accuracy, Precision, Recall, Sensitivity, Specificity, AUC, ROC, Bias-Variance decomposition, Bias Variance trade-off, Cross validation strategies, Decision Trees: Basic algorithm(ID3) for classification, Decision boundary for Decision Trees(x-y axis), Hypothesis search and Inductive bias, Issues in Decision Tree Learning - Over fitting, Solutions to over fitting, dealing with continuous values, Logistic Regression, Instance-based learning: k-nearest neighbor learning (Classification & Regression), Decision boundary for KNN",
      },
      {
        title: "Artificial Neural Networks (ANN), Support Vector Machines (SVM), Boosting",
        hours: 14,
        topics:
          "Artificial Neural Networks: Introduction, Perceptrons, Multi-layer networks and Back-propagation, Activation functions (Step, Sigmoid, Tanh, ReLU), Various Optimizers (GD, SGD, Momentum-based, Adagrad, Adam) Support Vector Machines - Margin and maximization, SVM - The primal problem, the Lagrangian dual, SVM - Solution to the Lagrangian dual, (Hard Margin and Soft Margin, Classification ONLY), Kernel Functions:Linear, Polynomial (Derivation only for linear function).Combining weak learners, improving performance with Gradient Boost, Random Forest",
      },
      {
        title: "Bayesian Learning, HMM and Unsupervised Learning",
        hours: 14,
        topics:
          "Bayesian Learning -Bayes theorem, Maximum likelihood, Bayes optimal classifier, Naïve Bayes Classifier, Expectation maximization and Gaussian Mixture Models. Hidden Markov Models (HMMs), Hierarchical vs. non-hierarchical clustering, Agglomerative and divisive clustering, K-means clustering, Bisecting K- means, K-Means as special case of Expectation Maximization",
      },
      {
        title: "Ml deployment and advanced learning paradigms",
        hours: 14,
        topics:
          "Introduction to Reinforcement Learning: agent, environment, states, actions, rewards, policy, value functions, Bellman equation, and Q-learning fundamentals., Introduction to Deep Learning, Introduction to Convolution operation and Convolution Neural Network (CNNs). (Parameter calculation, Max pooling, Avg pooling). Hyper parameter tuning methods: Grid Search, Random Search, Bayesian Optimization, Introduction to MLOps: MLOps Overview, ML Lifecycle & Production Challenges, Data & Feature Pipelines, Experiment Tracking & Model Versioning, Model Deployment & Serving, CI/CD/CT for ML Systems, Inference Systems, Monitoring, Drift & Observability, ML Orchestration",
      },
    ],
  },
  {
    code: "UE24CS341A",
    title: "Software Engineering",
    dept: "CSE",
    semester: 5,
    credits: 4,
    elective: false,
    endSemInDays: 35,
    description:
      "In this course, students learn and gain practical experience with software engineering principles, techniques, and tools. Topics in this course include requirements analysis, specification, architecture, design, programming style, testing, quality management, security validation, devOps, teamwork, and software project management. The practical experience centers on a semester-long team project, in which a software development project is carried through all the stages of the software life cycle. Particular emphasis is placed on performing all SDLC activities similar to industry setup.",
    textbooks: ["9780133943030", "9789353165710"],
    references: ["9781491926307"],
    units: [
      {
        title: "Introduction to Software Engineering and Requirements Engineering",
        hours: 16,
        topics:
          "Introduction, Case studies and motivation for SE, DevOps and CI/CD tools introduction and setup, Software development lifecycles overview (waterfall etc) and motivation for agile methodology.Agile approach of software development, Contrasting Agile and Plan driven approaches, Agile SCRUM model and exposure to other Agile approaches like Lean Agile, XP etc. Hands on Jira training. Security development lifecycle.Requirements Engineering: Requirement's introduction and properties, Feasibility, Requirements Elicitation, Analysis and modelling, Specification and Verification, Requirement Management and Requirements Traceability; Introduction to UML and development of use cases. Validation planning and security validation plan",
      },
      {
        title: "Software Project Management and Software Architecture, Design and Quality",
        hours: 12,
        topics:
          "Fundamentals, Software Project Management Lifecycle, Planning activities, Choice of Lifecycles, Project Organization, Software Estimation, Scheduling, Risk Management, Quality Management, Gantt charts basics, Monitoring of Execution and Control, Project Closure. RACI matrix with example Software Architecture: Case study for motivation of SW Arch, Architectural View, Styles, Architectural and Design Patterns. Modularity, interface definition, microservices intro, Security architecture, Agile context.Software Design: Modularity, importance of interfaces (API and ABI), Error definition, handling and management, Forward and backward compatibility, usage of UML. Quality and Test case development: Case studies and motivation, types of testing, technical debt, Test cases documentation, Black and white box testing",
      },
      {
        title: "AI, Implementation, SCM, DevOps",
        hours: 16,
        topics:
          "AI for SW Engineering and SE for AI/ML systems.CI/CD pipeline and tools for development, Introduction to software construction, Coding principles, standards and guidelines, Factors for effective coding - Defensive, Secure and Testable programming, Code Review / Peer Review, Security code reviews; logging, tracing, debugging techniques.Test case development and dynamic analysis, functional and non functional testing, security testing, Automation; mutation testing to validate test suiteSoftware Configuration Management (SCM): Elements of a Configuration Management System, Configuration Items, Baselines, Repositories, Branch Management, Build Management, Install, Change and Release Management, Patching and Patch Management",
      },
      {
        title: "Usability, Quality and System Testing",
        hours: 12,
        topics:
          "ICase study discussion, Industry talk, Usability, UX design, Code coverage, branch coverage; Ethics and Software Engineering; Opensource Introduction; SW maintenance and support; Security and Privacy aspects; Measurements and Matrix for Quality; Risk management for QualitySecurity Validation - Penetration Testing, Fuzzing; System testing - Regression testing, Integration testing,Demo and student presentations for the mini-project",
      },
    ],
  },
  {
    code: "UE24CS342AA1",
    title: "Advanced Algorithms",
    dept: "CSE",
    semester: 5,
    credits: 4,
    elective: true,
    endSemInDays: 42,
    description:
      "Algorithm Design and Analysis is a fundamental and important part of computer science. The course on Advanced Algorithms introduces the learner to advanced techniques for design and analysis of algorithms and explores a variety of applications. This course requires the student to have a desirable knowledge of Design and Analysis of Algorithm",
    textbooks: ["9780262046305", "9781848000698"],
    references: [],
    units: [
      {
        title: "Basics of Complexity",
        hours: 14,
        topics:
          "Asymptotic Notations, Standard notations and common functions, Recurrences and Solution of Recurrence equations- The Substitution method, the Recurrence tree method, the Master method, Amortized Complexity Analysis: Aggregate, Accounting and Potential Methods.NP-Completeness, NP Reduction. Computational efficiency, optimization techniques, memory usage, cache behaviour, and overall system- level performance",
      },
      {
        title: "String Matching Algorithms, Suffix Trees and Maximum Flow",
        hours: 14,
        topics:
          "Naive String Match, Rabin Karp, String matching with Finite State Automata, and Knuth Morris Pratt Algorithms, Suffix Arrays, Suffix Trees - Applications of Suffix Trees, Regular Expression Searches Using Suffix Trees, Flow Networks, The Ford-Fulkerson method, The Edmonds-Karp algorithm, Maximum Bi-Partite Matching",
      },
      {
        title: "Polynomials and FFT &Number-Theoretic Algorithms",
        hours: 14,
        topics:
          "Polynomials and FFT: Representation of Polynomials, Efficient Polynomial Multiplication, DFT and FFT, Efficient Implementation of FFT. Number-Theoretic Algorithms: Elementary notions; GCD, Modular Arithmetic, Solving modular linear equations, Modular Inverse, The Chinese remainder theorem, Powers of an element; RSA cryptosystem; Primality testing; Integer factorization",
      },
      {
        title: "Dynamic Programming Randomized Algorithms and Approximation Algorithms",
        hours: 14,
        topics:
          "Elements of Dynamic Programming, Problems - Coin- Row, Rod-Cutting, Matrix-Chain Multiplication, Longest Common Subsequence. Randomized Algorithms: Hiring Problem, Indicator random variables, Approximation Algorithm: Vertex Cover Problem, TSP, The Subset Sum Problem",
      },
    ],
  },
  {
    code: "UE24CS342AA2",
    title: "Data Analytics",
    dept: "CSE",
    semester: 5,
    credits: 4,
    elective: true,
    endSemInDays: 49,
    description:
      "The course explores the data analytics lifecycle: question formulation, data collection and cleaning, exploratory, analysis, visualization, statistical inference, prediction, and decision-making. Focuses on building analytical models using key principles and techniques. This course requires the student to have a desirable knowledge of Statistics for Data Science",
    textbooks: ["9783319296579"],
    references: ["9781071614181"],
    units: [
      {
        title: "Exploratory data analysis, ANOVA and correlation analysis",
        hours: 14,
        topics:
          "Introduction to business analytics, Data cleaning and dimensionality reduction, ANOVA, correlation analysis, hidden variables. 14 hours",
      },
      {
        title: "Regression Analysis",
        hours: 14,
        topics:
          "Simple linear regression (alternative computational approaches and an emphasis on model diagnostics and validation), multiple linear regression (alternative computational approaches and an emphasis on model interpretation, diagnostics and validation) and variations (such as ridge regression and lasso regression), an introduction to multivariate and nonlinear regression",
      },
      {
        title: "Time Series Analysis and Markov Chains",
        hours: 14,
        topics:
          "Time series data components, moving average and exponential smoothing methods, regression models for forecasting, AR model identification using ACF/ PACF, concept of stationarity - its importance, testing for stationarity and converting a non-stationary signal to stationary, ARMA and ARIMA modelling, Discrete Markov chains, Markov chains with Absorbing States, expected duration to reach a state from other states, computing the retention probability and customer lifetime value, confounding variables",
      },
      {
        title: "Recommender Systems",
        hours: 14,
        topics:
          "Collaborative filtering, knowledge-based filtering: constraint-based and case-based filtering, a brief introduction to text classification/ clustering for content-based filtering, mining of association rules and evaluation of recommender systems, A/B testing",
      },
    ],
  },
  {
    code: "UE24CS342AA3",
    title: "Internet of Things",
    dept: "CSE",
    semester: 5,
    credits: 4,
    elective: true,
    endSemInDays: 14,
    description:
      "Connected devices and embedded systems, IoT connectivity and protocols, edge and cloud orchestration, and IoT security.",
    textbooks: ["9781587144561", "9781118430644"],
    references: [],
    units: [
      {
        title: 'Foundations - The "Things" and Embedded Logic',
        hours: 14,
        topics:
          "Introduction to IoT, IoT Traffic Model, IoT Connectivity, IoT Architecture Basics: Perception (sensors), Network (gateways), and Application layers, IoTWF Model, The Core IoT Functional Stack. The Things in IoT - Sensors, Actuators and smart Objects: Sensors - Its Types, Sensors & Its Performance Metrics, Sensor Selection, Actuators and Its Types MEMS, Smart Objects. Microcontrollers (MCU): Deep dive into ESP32 and ARM Cortex-A, ARM Cortex-M architectures. Embedded C & Python: Programming GPIOs, Interfacing (I2C, SPI, UART), and Interrupt handling",
      },
      {
        title: "The Network - Connectivity & Protocols",
        hours: 14,
        topics:
          "Short-Range Protocols: BLE (Bluetooth Low Energy), Zigbee, and the new Matter/Thread standards (essential for 2026). Long-Range Protocols: LoRaWAN and NB-IoT for industrial/agricultural use cases. Application Protocols: MQTT (Publish/Subscribe), CoAP, and HTTP/WebSockets. Lightweight Encryption: Standard Cryptography vs. Lightweight Introduction to ASCON (NIST standard) and how it differs from heavy AES. Network Obfuscation: Hiding IoT devices behind gateways and using non-standard ports",
      },
      {
        title: "Edge computing & Cloud Orchestration for IoT",
        hours: 14,
        topics:
          "Introduction to IoT Analytics, IoT Data Pipelines & AI Integration, Edge Computing: Introduction to TinyML-running machine learning models on microcontrollers. Data Pipelines: Time-series databases (InfluxDB) and real-time visualization (Grafana). Cloud Integration: Connecting to AWS IoT Core or Azure IoT Hub for device management. Predictive Maintenance: Using sensor data to predict hardware failure before it happens",
      },
      {
        title: "Introduction to IoT Security",
        hours: 14,
        topics:
          'The IoT Attack Surface: Identifying vulnerabilities at each layer (Physical, Network, and Cloud). Common Vulnerabilities (OWASP IoT Top 10): A beginner-friendly look at weak passwords, insecure network services, and lack of update mechanisms. Zero Trust Architecture: Traditional network security vs Zero Trust, Limitations of perimeter-based security, Zero Trust principle: "Never Trust, Always Verify", Types of device authentication methods. Identity-based security vs network-based security. Firmware Hacking: Using Binwalk to look inside a firmware file for secrets. X.509 certificates - Introduction to X.509 certificate, Structure and components of digital certificates, Public key infrastructure (PKI) basics, Digital signatures and trust chain',
      },
    ],
  },
  {
    code: "UE24CS342AA4",
    title: "Applied Cryptography",
    dept: "CSE",
    semester: 5,
    credits: 4,
    elective: true,
    endSemInDays: 21,
    description:
      "Applied Cryptography focuses on the design, analysis, and implementation of cryptographic techniques used to secure modern digital systems. This course covers the complete spectrum-from classical ciphers and mathematical foundations to modern symmetric and asymmetric algorithms, cryptographic hash functions, and real-world security applications. It also introduces practical attack models, hardware security concepts, and emerging areas such as post-quantum cryptography.",
    textbooks: ["9780815354369", "9781439821916", "9783642041006"],
    references: ["9780134444284"],
    units: [
      {
        title: "Foundations, Number Theory & Classical Ciphers",
        hours: 14,
        topics:
          'Cryptography Basics: Security attacks (Passive vs. Active), Services, and Mechanisms. The CIA Triad, Threat models, Attack types: MITM, replay, side-channel, Cryptography vs security Mathematical Toolkit I: Modular arithmetic, GCD (Euclidean & Extended), Euler\'s Totient Function (ϕ), and Fermat\'s Little Theorem. Classical Techniques: Substitution Ciphers: Caesar, Monoalphabetic and Polyalphabetic:Vigenere, Playfair, and Hill Cipher. Transposition Ciphers: Rail Fence, Row-Columnar, and Double Columnar. Security Models: Semantic Security (IND-CPA, IND-CCA1, IND-CCA2). Distinguishing games and the "Random Oracle Model". Shannon\'s Theorem, Confusion and Diffusion, Entropy, and the concept of "Perfect Secrecy" (One-Time Pad)',
      },
      {
        title: "Symmetric Key Cryptography & Modern Standards",
        hours: 14,
        topics:
          "Block Ciphers: Introduction, Structure of Feistel Networks,Substitution-Permutation Networks (SPN), Feistel Networks Vs Substitution-Permutation Networks DES/3DES: Design and why they are deprecated. AES: Introduction to Galois field, Introduction to AES, Detailed rounds (SubBytes, ShiftRows, MixColumns, KeyExpansion). Modes of Operation: Electronic Codebook (ECB), Cipher Block Chaining (CBC), and Modern Authenticated Encryption (GCM & CCM). Randomness: PRNGs vs. TRNGs and their role in key generation. Attack on Block ciphers: Differential & Linear Cryptanalysis, Padding Oracle Attacks, Side-Channel Attacks",
      },
      {
        title: "Asymmetric Cryptography & Data Integrity",
        hours: 14,
        topics:
          "The Public Key Paradigm: Symmetric vs. Asymmetric trade-offs. Mathematical Toolkit II:, Prime number generation (Miller-Rabin), Chinese Remainder Theorem, Discrete Logarithm Problem (DLP), and Finite Fields (GF(2n)). Public Key Algorithms: RSA: Key generation, encryption, and OAEP padding. Diffie-Hellman: Key exchange and the Man-in-the-Middle (MITM) vulnerability. Elliptic Curve Cryptography (ECC): Point addition, doubling, and the security benefits of smaller key sizes (ECDH, ECDSA). Digital Signatures: Concept and security goals, RSA signatures, ECC-based signatures, PKI Infrastructure. Cryptographic Hashes: Properties (Pre-image, Collision resistance), Merkle-Damgård construction, SHA- 256 Unit 4: Applied Crypto, Attacks & Future Trends",
      },
    ],
  },
  {
    code: "UE24CS342AA5",
    title: "Augmented and Virtual Reality",
    dept: "CSE",
    semester: 5,
    credits: 4,
    elective: true,
    endSemInDays: 28,
    description:
      "This course presents an introduction to virtual and augmented reality technologies, with an emphasis on designing and developing interactive virtual and augmented reality experiences using blender and Unity3D",
    textbooks: ["9780132545235", "9781108182874", "9781492044192"],
    references: [],
    units: [
      {
        title: "Geometric Objects and Transformations",
        hours: 14,
        topics:
          "Scalars, Points and Vectors, Three-Dimensional Primitives, Coordinate Systems and Frames, Modelling a Coloured Cube, Overview of 2D Transformations: Rotation, Translation and Scaling, Affine transformations, Transformation in Homogeneous Coordinates, Concatenation of Transformations, OpenGL Transformation Matrices, Interfaces to Three Dimensional Applications, Quaternion's",
      },
      {
        title: "Graphical System and Programming and 3D Modelling",
        hours: 14,
        topics:
          "The Programmer's Interface, Graphics Architectures, Programmable Pipelines. Graphics Programming: Programming Two Dimensional Applications. The OpenGL: The OpenGL API, Primitives and Attributes, Colour, Viewing, Control Functions, Polygons, Viewing, Control Functions, the gasket Program, Polygon and Recursion, The Three-dimensional gasket, Creating Scene on ThreeJS, Working with Three.Js Material and Geometries, Animations, Adding Physics, Working with Blender, Three.JS with React and WebXR",
      },
      {
        title: "Augmented and Virtual Reality",
        hours: 14,
        topics:
          "Introduction to Augmented Reality: Definition and Scope, A Brief History, Examples, Requirements and Characteristics: Methods of Augmentation, Spatial Display Models, Visual Display, Stationary Tracking Systems, Mobile Sensors. Introduction: What is Virtual Reality, Modern VR Experience. Bird's Eye View: hardware, Software. Eye movement and its implications or VR. Tracking: 2D and 3D orientation, Tracking Position and Orientation, Tracking Attached bodies",
      },
      {
        title: "IO modalities, AI, and Behaviour in VR",
        hours: 14,
        topics:
          "Computer Vision and Augmented Reality; marker tracking, Multiple-Camera Infrared Tracking, Natural Feature Tracking by Detection, Incremental Tracking, Simultaneous Localization and Mapping, Outdoor Tracking, Interaction: Output and input modalities, Haptic interaction and Multimodal interaction. 3D Scanning of environments. Reactive AI: Adaptability, Complexity and Universality, Feasibility, More Intelligence in the System: Deliberative AI, Reinforcement learning through interaction, Imitation Learning through human demonstration",
      },
    ],
  },
  {
    code: "UE24CS342AA6",
    title: "UI/UX Design",
    dept: "CSE",
    semester: 5,
    credits: 4,
    elective: true,
    endSemInDays: 35,
    description:
      "This course introduces the fundamental concepts of Human Computer Interaction (HCI) and UI/UX Design, focusing on designing interactive, user friendly, and accessible digital systems. It covers user centered design principles, interaction design, prototyping, usability evaluation, accessibility, and emerging trends in HCI. The course enables students to understand user behavior, create effective user interfaces, and evaluate user experiences using modern design tools and techniques",
    textbooks: ["9781119547259", "9780130461094"],
    references: ["9780134380384"],
    units: [
      {
        title: "Foundations of HCI and User Experience Design",
        hours: 14,
        topics:
          "Definition, Importance, and Goals of HCI, Human Factors in HCI: Perception, Cognition, Memory, Mental Models, Interaction Models: Gulf of Execution & Evaluation, Norman's Model, User-Centered Design (UCD) Process UX Research Methods: Interviews, Surveys, Observation UX Synthesis Techniques: Affinity Diagramming, Personas, Scenarios, Empathy Mapping, User Journey Mapping, Task Analysis Information Architecture: Navigation Design, Content Hierarchy Design Principles: Affordances, Feedback, Consistency, Universal Design Principles",
      },
      {
        title: "Interaction Design and Prototyping",
        hours: 14,
        topics:
          "Interaction Styles: Command Line, GUI, Voice Interfaces, Gesture-Based Interfaces, Design Thinking and Ideation Techniques Visual Interface Design Principles: Typography, Color Theory, Layout and Spacing, Visual Hierarchy Wireframing and Prototyping: Low-Fidelity Prototypes, High-Fidelity Prototypes, Figma as a Prototyping Tool, Interface Design Guidelines: Google Material Design Guidelines, Apple Human Interface Guidelines Responsive and Mobile-First Design Case Studies in Interaction and UI Design",
      },
      {
        title: "Usability Evaluation, Accessibility, and UX Testing",
        hours: 14,
        topics:
          "Usability Principles - Learnability, Efficiency, Memorability, Error Prevention, User Satisfaction Evaluation Methods - Heuristic Evaluation, Cognitive Walkthrough, User Testing, Think-Aloud Protocol, A/B Testing UX Metrics and Analytics: Task Completion Rate, Error Rate, Time on Task, SUS (System Usability Scale) Web & Mobile Accessibility: Web Content Accessibility Guidelines (WCAG), Inclusive Design, Assistive Technologies Analyzing Usability Data: Metrics, Surveys, Interviews, Feedback Analysis Ethical Design and Dark Patterns in UX",
      },
      {
        title: "Emerging Trends in UI/UX & Future of HCI",
        hours: 14,
        topics:
          "AI in HCI: Chatbots, Recommender Systems, Personalized User Experience. Conversational UI and Voice User Interfaces (VUI) Virtual & Augmented Reality (VR/AR) Interfaces,Brain-Computer Interfaces (BCI) & Wearable Computing Cross-Platform and Cross-Cultural UI/UX Design Ethical & Social Implications of HCI Emotional Design and Persuasive Design, Design for Globalization and Accessibility Challenges, Future Trends in Human-Centered Computing",
      },
    ],
  },
  {
    code: "UE24CS342AA7",
    title: "Modern Wireless and 5G Systems",
    dept: "CSE",
    semester: 5,
    credits: 4,
    elective: true,
    endSemInDays: 42,
    description:
      "Wireless technologies and cellular engineering, the foundations of 5G, the cloud-native 5G core, and advanced 5G applications.",
    textbooks: ["9780133594140"],
    references: [],
    units: [
      {
        title: "Wireless Technologies & Cellular Engineering Principles",
        hours: 14,
        topics:
          "Wireless Communication Fundamentals: Wireless network architectures, IEEE 802.11 standards and Wi- Fi evolution, medium access and multiple access techniques, digital modulation, Bluetooth, NFC, RFID, Intelligent Vehicular Networks, and wireless security protocols (IEEE 802.1X). 14 hours",
      },
      {
        title: "Foundations of Cellular Systems and 5G Architecture",
        hours: 14,
        topics:
          "Cellular Systems and 5G NR: Evolution of wireless generations (1G-6G), cellular architecture, mobile connectivity, frequency reuse, handoff, MIMO, Massive MIMO, beamforming, and small cells; 5G NR architecture, SA/NSA deployment models, gNB functional architecture, protocol stack, reference interfaces, and signaling procedures for network call flows. 14 hours",
      },
      {
        title: "Cloud-Native 5G Core, Services and Applications",
        hours: 14,
        topics:
          "5GC Technologies and Applications: 4G EPC and 5G Service-Based Architecture (SBA), 5G Core network functions and interfaces, registration and session management procedures, VoIP fundamentals (SIP, RTP), IMS and VoNR architecture, and virtualization technologies including SDN and NFV for next-generation mobile networks. 14 hours",
      },
      {
        title: "5G Advanced Applications and Evolution to 6G",
        hours: 14,
        topics:
          'Advanced 5G Applications and 6G Evolution: Network slicing, MEC, Open RAN, AI/ML-driven network intelligence, NTN and Private 5G networks, cellular security and forensics, Digital Twins, AI-native networks, ADAS applications, and emerging 6G technologies including Terahertz communications and Intelligent Reflecting Surfaces (IRS). 14 hours Disclaimer: There is no fixed text book. Lectures will be drawn from several sources (books, articles, papers) as most available texts do not cover all of the course material. The text book listed covers some of the topics that are relevant to the material presented. 1. "Computer Networking: A Top Down Approach", James Kurose and Keith Ross, Pearson, 8th Edition,2022. Books, Articles and Papers At the end of the course, the student will be able to: Explain wireless standards, access protocols, and security in wireless networks. Learn cellular standards based on different wireless technologies Analyze 4G and 5G network architectures and key protocols. Evaluate 5G applications, network slicing, and the transition to 6G technologies',
      },
    ],
  },
  {
    code: "UE24CS343AA8",
    title: "Quantum Computing",
    dept: "CSE",
    semester: 5,
    credits: 4,
    elective: true,
    endSemInDays: 49,
    description:
      "This course is meant to give an overview of the field of quantum technologies and make the students familiar with the state-of-the-art in all four verticals. The emphasis is not on depth in this course, but on covering the exciting aspects of the field",
    textbooks: ["9798985593112"],
    references: ["9781107002173"],
    units: [
      {
        title: "Logic of Qubits",
        hours: 14,
        topics:
          "Quantum bit, Super Position, Measurement, Block Sphere Mapping, Quantum Gates & Circuits. Quantum States, Inner Products, Quantum Gates, Outer Products 14 hours",
      },
      {
        title: "Multiple Quantum bits and Quantum Programming",
        hours: 14,
        topics:
          "States and Measurement, Entanglement, Quantum Gates and Adders, Universal Quantum Gates, Quantum Error Correction. Quantum programming using Qiskit and other programming languages. 14 hours",
      },
      {
        title: "Entanglement and Quantum Protocols",
        hours: 14,
        topics:
          "Measurements, Bell Inequalities, Monogamy of Entanglement, Superdense coding, Quantum Teleportation, Quantum Key Distribution.. 14 hours",
      },
      {
        title: "Quantum Algorithms & Applications",
        hours: 14,
        topics:
          "Deutsch & Deutsch-Jozsa, Simon's Algorithm, Grover's Algorithm, Shor's Algorithm 14 hours \"Introduction to Classical and Quantum Computing\" by Thomas G. Wong, Published by Rooted Grove, 2022. \"Quantum Computing for Computer Scientists\" by Noson S. Yanofsky & Mirco A. Mannucci, Cambridge University press, 2008. The various hardware implementations of qubits for computation Calculate the state of a quantum system using matrix mechanics and Dirac notation. Execute quantum teleportation and superdense coding protocols. Evaluate the efficiency of Grover's and Deutsch-Jozsa algorithms compared to classical limits. Title Visualization of Data, Understanding and",
      },
    ],
  },
  {
    code: "UE24CS342AA9",
    title: "Visualization of Data, Understanding and Interpretation",
    dept: "CSE",
    semester: 5,
    credits: 4,
    elective: true,
    endSemInDays: 14,
    description:
      "Visualisation foundations and data interpretation, storytelling with data, multimedia and interactive visualisation, and AI-assisted visualisation.",
    textbooks: ["9781492031086", "9781119002062", "9780128128756"],
    references: [],
    units: [
      {
        title: "Foundations of Visualization, Data Interpretation",
        hours: 14,
        topics:
          "Introduction to data visualization, Role of Visualization in AI-driven Analytics, Visual encoding (marks & channels), Human perception & cognition, Gestalt principles, Color theory and design, Static vs Interactive Visualizations, Data preprocessing & Exploratory Data Analysis (EDA), Identifying trends, correlations and patterns, Multivariate visualization, Statistical thinking, Perceptual effectiveness of charts, Data-ink ratio and chart junk, Misleading visualizations and ethical concerns",
      },
      {
        title: "Advanced Visualization & Story Telling",
        hours: 14,
        topics:
          "Advanced visualizations: Networks, node-link diagrams, treemaps, saliency visualization. Dimensionality reduction visualization: PCA, t-SNE, UMAP. Geospatial visualization, Feature importance visualization, Uncertainty visualization, Interactive dashboards, Coordinated multiple views. Storytelling with data, Narrative visualization, AI-generated reports and summaries, Audience-centric design, Annotation & highlighting, Ethical visualization and accessibility",
      },
      {
        title: "Multimedia and Interactive Visualization",
        hours: 14,
        topics:
          "Multimedia visualization concepts, Image, video and audio visualization, Scientific visualization fundamentals, Scalar and vector field visualization, Volume visualization, Medical and simulation data visualization, 3D visualization and rendering basics, Animation and motion visualization, Temporal visualization, Graph drawing and network layout techniques (force-directed and hierarchical layouts), Visualization pipelines and rendering process, Interactive visualization techniques: brushing, linking, filtering, zooming and details-on-demand, Visual analytics and sensemaking, Visualization evaluation methods, Usability testing and cognitive load analysis, Dashboard design principles and accessibility in visualization systems",
      },
      {
        title: "AI-Assisted Visualization",
        hours: 14,
        topics:
          "Automated visualization tools: Auto chart recommendation systems, Natural Language to Visualization (NL2Vis), conversational visualization systems, text-to-chart generation, Automated generation of dashboards, Data summarization and interpretation using LLMs for EDA insights, Introduction to human- in-the-loop AI in visualization, AI-assisted pattern recognition, Anomaly detection, Bias in AI-driven insights, Model drift visualization, Uncertainty visualization in AI models, Visualization of ML outputs: predictions, probabilities and confidence measures, Explainable AI (XAI) visualizations, Monitoring AI systems using visual analytics, Misuse and limitations of automated insights",
      },
    ],
  },
  {
    code: "UE24CS343AB1",
    title: "Image Processing",
    dept: "CSE",
    semester: 5,
    credits: 4,
    elective: true,
    endSemInDays: 21,
    description:
      "Digital Image Processing deals with processing images that are digital in nature. Improving the quality of images for human perception and understanding, extracting useful information for decision making and efficient storage are some of the driving factors behind image processing techniques/algorithms. The course on Digital Image Processing introduces the learner to various image processing techniques, algorithms and their applications",
    textbooks: ["9780133356724"],
    references: [],
    units: [
      {
        title: "Introduction and Enhancement in the Spatial Domain",
        hours: 14,
        topics:
          "What is Digital Image Processing, examples of fields that use DIP, Fundamental Steps in Digital Image Processing, elements of visual Perception, Basic Concepts in Sampling and Quantization, Representing Digital Images, Spatial and Gray-level Resolution, Zooming and Shrinking Digital Images, Some Basic Relationships Between Pixels, Linear and Nonlinear Operations. Image Enhancement in the Spatial Domain: Some Basic Gray-level Transformations, Histogram Processing, Enhancement Using Arithmetic/Logic Operations, Basics of Spatial Filtering, Smoothing Spatial Filters, Sharpening Spatial Filters, and Combining Spatial Enhancement Methods",
      },
      {
        title: "Image Enhancement in the Frequency Domain, Transforms and Compression",
        hours: 14,
        topics:
          "Frequency Domain: Introduction to the Fourier Transform and the Frequency Domain, Smoothing Frequency-Domain Filters, Sharpening Frequency Domain Filters, Homomorphic filtering. Image transforms (such as, DCT, Harr, DWT) for applications. Image Compression: Fundamentals - Image Compression Models, Some encoding techniques (including, block processing and transform- based techniques)",
      },
      {
        title: "Morphological Image Processing, Preliminaries of segmentation and Color",
        hours: 14,
        topics:
          "Image Processing Dilation and Erosion, Opening and Closing, the Hit-or-Miss Transformation, Some Basic Morphological Algorithms. Image Segmentation: Detection of Discontinuities, Edge Linking and Boundary Detection, Thresholding, Region-Based Segmentation. Color Models, Color Transformations, Smoothing and Sharpening",
      },
      {
        title: "Feature extraction, pattern classification",
        hours: 14,
        topics:
          "Boundary Preprocessing, Boundary Feature Descriptors, Region Feature Descriptors, Transform, Image pattern classification using minimum distance classifier and prototype matching, deep convolutional neural networks and some of its recent variations for computer vision applications (UNet for segmentation, ResNet for feature extraction, YoLo for object detection) and recent advances in computer vision",
      },
    ],
  },
  {
    code: "UE24CS343AB2",
    title: "Big Data",
    dept: "CSE",
    semester: 5,
    credits: 4,
    elective: true,
    endSemInDays: 28,
    description:
      "Big data infrastructure for compute and storage, in-memory computation with Spark, and streaming and advanced analytics.",
    textbooks: ["9781491901632", "9781491944240"],
    references: ["9781108476348"],
    units: [
      {
        title: "Introduction",
        hours: 14,
        topics:
          "Big Data definition, Challenges and opportunities with Big Data, Data intensive scientific discovery and the role of Big Data, History, Distributed Storage - Google File System, HDFS, Computation model, Map Reduce architecture, YARN introduction, Google Big Query. Big Data Algorithms - matrix multiplication and PageRank, Issues with Hadoop, Complexity of Big Data algorithms - Communication Cost complexity model",
      },
      {
        title: "Big data infrastructures (Compute/Storage)",
        hours: 14,
        topics:
          "Hadoop Ecosystem - Apache HIVE, HBase, Cassandra, Apache Iceberg: A high-performance table format for data lakes that simplifies data ingestion by providing SQL-like ACID transactions and schema evolution. Apache Sea Tunnel: A very high-performance distributed data integration tool that supports synchronizing huge amounts of data between hundreds of data sources. Apache Druid - a high-performance analytics database for both real-time and historical data. Apache Hudi - brings real-time updates and incremental processing to data lakes Apache Airflow - a workflow orchestration platform for managing ETL pipelines and complex data workflows",
      },
      {
        title: "In memory computation",
        hours: 14,
        topics:
          "Spark and Scala/ PySpark programming model, Transformations and Actions, Spark SQL, Relational operators with Spark, Spark architecture - RDD, Data Frames, Wide and Narrow dependencies, Streaming Algorithms -sampling, set membership - Bloom Filters counting, counting unique elements - Flajolet Martin Algorithm",
      },
      {
        title: "Streaming analysis and advanced analytics on Big Data",
        hours: 14,
        topics:
          "Streaming analytics use cases, Kafka - use cases, architecture, Streaming Spark, Apache Flink,, Spark MLLib - working examples, Spark GraphX, practical examples of Big Data success stories",
      },
    ],
  },
  {
    code: "UE24CS343AB3",
    title: "Graph Theory and its Applications",
    dept: "CSE",
    semester: 5,
    credits: 4,
    elective: true,
    endSemInDays: 35,
    description:
      "Graph theory from paths, cuts and planarity to colouring and applications, graph databases and the analysis of social networks.",
    textbooks: ["9788120301450", "9781491930854"],
    references: [],
    units: [
      {
        title: "Introduction, Paths, Cuts, Planar Graphs, and Vizing's Theorem",
        hours: 14,
        topics:
          "Introduction- Representation and Traversals, Walks, Paths, Circuits - Euler graphs, Hamiltonian paths and circuits - Directed graphs, Digraphs and binary relations - Trees: Properties, Rooted trees, Binary trees, Spanning trees - Cut sets, Fundamental circuits and cut sets - Connectivity and Separability - Network flows, Isomorphism - Vizing's Theorem",
      },
      {
        title: "Graph Coloring, Graph Applications, and Brooks' Theorem",
        hours: 14,
        topics:
          "Planar Graphs - Different representations - Chromatic number, Chromatic partitioning, Chromatic polynomial - Matching, Covering - Four Colour Problem - Register allocation using graph coloring - Minimum Spanning Trees - Shortest Path Problem - Articulation Points - Network Flow Algorithms - Chinese Postman Problem - Time Table Problem - Strongly Connected Components - Brooks' Theorem on Colorings, Dynamic Graph Algorithms- Dynamic Connectivity",
      },
      {
        title: "Graph Databases and Graphs in Social Networks",
        hours: 14,
        topics:
          "Graph Database: RDBMS vs Graph Database - Neo4j Basics: Graph Data Model (Nodes, Properties, Relationships, Labels) - Basic CQL Commands, Cypher Query optimization, Knowledge Graphs- Build knowledge graphs using Neo4j, Graphs in Social Networks: Centrality Measures: Degree, Betweenness, Closeness, Eigenvector, PageRank - Measures of Cohesiveness: Degree Distribution, Diameter, Transitivity - Connected Components (in/out/weak/strong combined) - Groups and Substructures: Clique, N-clique, N- core",
      },
      {
        title: "Graphs in Social Networks and Social Graph Dynamics",
        hours: 14,
        topics:
          "Community Detection: Cluster vs Community, Overlapped Communities (CPM), Girvan-Newman Algorithm, Louvain Algorithm - Generative Models: Random Graphs- Evolution and properties, Small World: Milgram's Small World Experiment, Watts-Strogatz Model, Barabási-Albert Model - Information diffusion in Social Graphs: Herd Behavior, Diffusion of Innovation (Bass Model), Epidemic Modeling, Information Cascades",
      },
    ],
  },
  {
    code: "UE24CS343AB4",
    title: "Modern Android App Development with Kotlin",
    dept: "CSE",
    semester: 5,
    credits: 4,
    elective: true,
    endSemInDays: 42,
    description:
      "Modern Android development in Kotlin: app fundamentals, Jetpack Compose, intents and services, networking and deployment.",
    textbooks: [],
    references: ["9781492076490"],
    units: [
      {
        title: "Kotlin and the Android Development Environment",
        hours: 14,
        topics:
          "Introduction to Android Setting up Development Environment Introduction to Kotlin Variables and Primitive Data Types, Nullable Variables, Conditional Statements, For and While Loops, and Loop Control Statements, Functions and Arguments, Functional Programming with Lambdas, Creating Collections and Operations, Classes and Objects, Inheritance, Data Classes, Interfaces, Exception Handling 14 hrs",
      },
      {
        title: "Android Application Fundamentals and Jetpack Compose",
        hours: 14,
        topics:
          "Android Application Fundamentals - Activity, Service, BroadcastReceiver, ContentProvider Jetpack Compose Setup - UI Elements such as Text, Image, Buttons, Layouts including Column, Row Modifiers, Alignment and Arrangement, State Management - remember, mutableStateOf Custom Composables, Forms, Lists & Lazy Components - Using LazyColumn, LazyRow and Card, Using Scaffold, Compose Navigation, Side Effects & Lifecycle 14 hrs",
      },
      {
        title: "Intents, Broadcast Receivers and Services",
        hours: 14,
        topics:
          "Intents, BroadcastReceivers, Services: Types of Intents, Intent Filter, Sending Broadcast, Receiving Broadcast, Registering BroadcastReceivers, Service life Cycle Data Persistency: SharedPreference, Room Database Resources: Types of Resources, Creating and using resources 14 hrs",
      },
      {
        title: "Web Communication and App Deployment",
        hours: 14,
        topics:
          "Web Communication: Using Third Party Networking Libraries -using Retrofit, Downloading Images - using Glide App Deployment: Application Signing, Deploying APP in Play Store Introduction to Advanced Android Features and AI Integration: Camera, Sensors, Firebase Integration, ML kit GenAI APIs 14 hrs 1. Android Studio Meerkat Essentials - Compose Edition: by Neil Smyth, Payload Media, 2025. ISBN:978-1-965764-12-1 1. Head First Android Development by Dawn Griffiths, David Griffiths - O'Reilly Media, 2nd Edition, 2021 2. Head First Kotlin by Dawn Griffiths, David Griffiths - O'Reilly Media, 2019 3. Building Modern Android Apps with Jetpack Compose and Kotlin by Peter Späth, Apress publisher, 1st Edition, 2023 4. Kotlin Programming Language (Web Source) 5. Android Mobile App Developer Tools - Android Developers Apply Kotlin programming fundamentals, object-oriented principles, and functional programming concepts to develop basic Android applications using the Android development environment Develop responsive Android user interfaces using Jetpack Compose by implementing UI components, state management, navigation, and lifecycle-aware application behavior. Implement Android application communication, background services, data persistence, and resource management techniques using intents, broadcast receivers, services, local storage, and application resources Build and deploy Android applications by integrating web communication libraries, device hardware features, and AI-powered functionalities, and publish applications to the Google Play Store",
      },
    ],
  },
  {
    code: "UE24CS343AB5",
    title: "Intelligent Vehicles: Connectivity and Cybersecurity",
    dept: "CSE",
    semester: 5,
    credits: 4,
    elective: true,
    endSemInDays: 49,
    description:
      "Automotive cybersecurity: in-vehicle communication, threat modelling and risk assessment, and secure system design for connected vehicles.",
    textbooks: [],
    references: [],
    units: [
      {
        title: "Introduction to Automotive Cybersecurity and Intelligent Autonomous Vehicle",
        hours: 14,
        topics:
          "Understanding the Vehicle E/E Architecture & Cybersecurity Fundamentals,Evolution of Automotive E/E Architecture and the Cybersecurity Imperative, In Vehicle Communication Protocols: CAN, LIN, FlexRay, Automotive Ethernet,Cybersecurity Basics for Automotive Use Cases, Classification of Autonomous Vehicle Based on Driving Levels, State of the Art of Intelligent and Autonomous Vehicle Technologies, Battle for Adoption, Market Demand of Automotive Cyber Security, attack Surfaces in Modern Vehicles (ECUs, Telematics, Sensors, OTA, Automotive Ethernet and Time-Sensitive Networking (TSN): Support for High- Bandwidth Audio, Video, Sensor Data, and Real-Time Vehicle Applications",
      },
      {
        title: "Cyber Security in In-Vehicle Communication and Inter-Vehicle Communication",
        hours: 14,
        topics:
          "In-Vehicle System, In-Vehicle Communication, In-Vehicle Network Architecture and Topology, Functional Safety and Cybersecurity, In-Vehicle Cybersecurity Issues and Challenges, Cyber Security in In-Vehicle Network (IVN), Internet of Vehicles (IoV), Machine Learning in Vehicular Networks, Vehicular Social Network",
      },
      {
        title:
          "Threat Modeling and Risk Assessment: Practical Threat Modeling and Security ControlsAUTOSAR",
        hours: 14,
        topics:
          "Embedded Security in Vehicles,Introduction to Functional Safety in Automotive Systems, Overview of Threat Analysis and Risk Assessment (TARA), STRIDE Model, Attack Trees, and MITRE ATT&CK for Vehicles, Asset Identification and Impact Analysis, Mapping Threats to Risk Levels and Determining Risk Treatment Options, Comparison of HARA (Safety) vs. TARA (Security) Approaches",
      },
      {
        title:
          "Secure System Design and Implementation, Standards, Regulations, and Lifecycle Management",
        hours: 14,
        topics:
          "Automotive Cybersecurity Standards & ISO 26262/SAE 21434, Principles of Secure Embedded System Design, In-vehicle Cryptographic Techniques: Secure Boot, Key Management, TLS, MACsec, Intrusion Detection Systems (IDS) in Automotive Context, Penetration Testing of Automotive Interfaces (CAN fuzzing, ECU spoofing), Secure Coding Guidelines for Automotive Software, Secure Diagnostics and Access Control Mechanisms, ISO/SAE 21434 Standard: Cybersecurity in the V-Model Lifecycle, UNECE WP.29 Cybersecurity Regulations: Compliance and Certification, Cybersecurity Management Systems (CSMS) and Organizational Processes, Post-production Monitoring, Incident Response, and OTA Security Updates, Cybersecurity Assurance Levels (CALs) vs. ASILs in Functional Safety, Industry Practice: OEM Cybersecurity Frameworks and Supplier Requirements",
      },
    ],
  },
  {
    code: "UE24CS343AB6",
    title: "Computer Network Security",
    dept: "CSE",
    semester: 5,
    credits: 4,
    elective: true,
    endSemInDays: 14,
    description:
      "Packet sniffing and spoofing, TCP and DNS attacks, firewalls, intrusion detection and prevention, VPNs and wireless security.",
    textbooks: ["9781733003902", "9781292066172"],
    references: [],
    units: [
      {
        title: "Introduction, Packet Sniffing & Spoofing, MAC Layer Attacks, Network Layer Attacks",
        hours: 14,
        topics:
          "Packet Sniffing and Spoofing using C: Socket programming using C, Endianness, BSD packet filter (BPF). Packet sniffing using Raw sockets, Constructing spoofed raw ICMP packets and UDP packets. Python vs Scapy, MAC layer and attacks: The MAC layer Attack: ARP protocol, ARP cache poisoning attacks, MITM using ARP cache poisoning, Countermeasure. MACsec. Network layer attacks: IP Fragmentation, IPSec",
      },
      {
        title: "TCP Attacks and DNS Attacks",
        hours: 14,
        topics:
          "Attacks on the TCP protocols: TCP overview, Send and receive buffers, SYN flood attack: TCP 3-way handshake, the SYN flooding attack, Launching the attack using Netwox and C, Countermeasure. TCP reset attack: TCP reset attack on Telnet, SSH and video streaming connections. TCP session hijacking attack: TCP session and session hijacking, Launching the attack, Hijacked TCP connection. Reverse shell: working, redirecting IO to TCP connection, Creating reverse shell. Countermeasure. DNS Attacks: DNS hierarchy, zones and servers, DNS query process, Constructing DNS request and response using Scapy, DNS attacks: Overview, Local DNS cache poisoning attack",
      },
      {
        title: "Firewall, IDS, IPS, Honeypots",
        hours: 14,
        topics:
          "Remote DNS cache poisoning attack (Kaminsky attack), Reply forgery attacks from malicious DNS servers, DNSSEC, TLS. Case Study - 1 Firewall: Introduction, Requirements of a firewall, Firewall characteristics and Access policy, Types of firewalls, NG firewall, Shortcomings, Firewall location and configuration: DMZ networks, Firewall topologies. Introduction, Build a simple firewall, Netfilter, iptables firewall in Linux, Stateful firewall and connection tracking, Application/Proxy firewall and Web proxy, Evading firewalls. Intrusion Detection and Prevention: Intruders, Intrusion detection, Analysis approaches, Host-based intrusion detection, Network-based intrusion detection, Distributed or hybrid intrusion detection, Honeypots, Example system: Snort",
      },
      {
        title: "Virtual Private Networks, Wireless security",
        hours: 14,
        topics:
          "Virtual Private Network: Introduction, Why VPN, analogy, and tunnelling. Overview of TLS/SSL VPN: Establishing a tunnel, Forwarding, and releasing IP packets, TLS/SSL VPN details. Building, Setup and Testing VPN. Bypassing Firewall using VPN. Case Study - 2. Wireless Security: Communications and 802.11 WLAN standards: Wired Equivalent Privacy (WEP), Wireless Protected Access (WPA), IEEE 802.1x, 802.11i/ WPA2, Wireless Network Threats. Brief introduction to SOC and SIEM",
      },
    ],
  },
  {
    code: "UE24CS343AB7",
    title: "ROS for Autonomous Systems",
    dept: "CSE",
    semester: 5,
    credits: 4,
    elective: true,
    endSemInDays: 21,
    description:
      "To introduce the foundational principles of autonomous systems, focusing on mobile robotics and programming using ROS (Robot Operating System). The course integrates theoretical understanding with simulation-based hands-on experience",
    textbooks: ["9781484234044", "9781788478953"],
    references: [],
    units: [
      {
        title: "Introduction to Autonomous Robotics & Simulation Tools",
        hours: 14,
        topics:
          "What is a robot? Definitions, types, and criteria, Sensors, actuators, controllers, Autonomous vs. telerobot systems; Environment classification. Overview of ROS, its architecture, and installation, RSVP: Robot Scenario Visual Planning; Hands-on Activities: Installing ROS and setting up workspace, Creating and launching ROS nodes (publisher/subscriber)",
      },
      {
        title: "Sensor Integration, Motor Control and Simulation",
        hours: 14,
        topics:
          "Programming sensors: Color, ultrasonic, IMU, camera, Motor/servo characteristics and programming, Sensor packages and interfacing in ROS; Hands-on Activities: Simulating robot with LiDAR/camera in Gazebo, Sensor visualization with RViz and ROS topics, Motor movement control in a ROS simulation",
      },
      {
        title: "Localization",
        hours: 14,
        topics:
          "Environment perception: Coordinate frames, TFs, Introduction to mapping: occupancy grids, SLAM, RSVP and SPACES methodology for decision making; Hands-on Activities: Building a 2D map using SLAM, Simulating perception using TurtleBot3 in Gazebo",
      },
      {
        title: "Planning and Navigation",
        hours: 14,
        topics:
          "Localizing the robot in a map, ROS Navigation Stack-hardware requirement-navigation packages, path planning, motion planning of robot - software requirement and configuration. Navigation using Reinforcement learning and Imitation learning",
      },
    ],
  },
  {
    code: "UE24CS343AB8",
    title: "Enterprise Business Systems for Engineers",
    dept: "CSE",
    semester: 5,
    credits: 4,
    elective: true,
    endSemInDays: 28,
    description:
      "Enterprise business systems and ERP: change management and reengineering, functional modules, selection and emerging trends.",
    textbooks: ["9780070700888"],
    references: ["9780134731889"],
    units: [
      {
        title: "Introduction to Enterprise Business Systems",
        hours: 14,
        topics:
          "Introduction to EBS, Value Chain Framework, Problems with Disintegrated Data in an Organization, Evolution of ERP Systems, Role of ERP Systems in an Organization, Scope of ERP Systems, General Model of Business and Role of ERP, Major ERP Players, Implementations Types - On-prem, Cloud, Hybrid, Two- tier. Life Cycle of an ERP Implementation Project: Life Cycle of an ERP Project, ERP Project Teams, Implementation Methodologies, Deployment Methods. Benefits and Cost of an ERP System: Benefits, Cost of an ERP Implementation, Cost-Benefit Analysis. 14 hours",
      },
      {
        title: "Change Management, Re-Engineering and BPM: Change Management",
        hours: 14,
        topics:
          "Change Management: People Issues: Are You Ready for ERP, Factors that Influence Pre-implementation Attitude, How to Enhance Attitude?, Change Management Strategies to Handle Organizational Issues, Creating a Change Management Strategy to Handle Organizational Issues, Tools for Assessing the Organizational Changes. Re-Engineering: Processes and their Characteristics, Life Cycle of a BPR Project, Life Cycle of an IT-driven BPR Project, Re-engineering Examples, Case Studies. Business Process Modelling and Business Modelling: BPM Introduction, Business Process Hierarchy, Standards for Business Processes and Modelling, Process Modelling Maturity and Multi-Dimensional Modelling, Process Modelling Software, Business Modelling, Integrated Data Modelling. 14 hours",
      },
      {
        title: "ERP Functional Modules: Human Capital Management",
        hours: 14,
        topics:
          "Human Capital Management: HCM Systems, Leading HR Solutions from ERP Vendors, Strategic Vs. Operational HR Processes and HR Outsourcing, Employee Health and Safety. Financial Management: ERP Financial Application, Financial Modules in Detail. Procurement and Inventory Management: Procurement, Inventory Management. Production Planning and Execution: Understanding MRP II Concepts, How ERP PP module supports MRP II Processes, Critical Master Data Elements, Managing different Production Scenarios.. 14 hours",
      },
      {
        title: "ERP Selection and Emerging Trends",
        hours: 14,
        topics:
          'ERP Solution and Vendor Selections, Selection Criteria, Request for Proposal (RFP), Gap Analysis, ERP Selection Team. Managing an ERP Project: Critical Success Factors, Project Risks, Key Performance Metrics and Data Migration. ERP and Related Technologies: Supply Chain Management (SCM), Customer Relationship Management (CRM), Product Life Cycle Management (PLM), Data Warehousing and Business Intelligence (DW-BI). Introduction to Commercial ERP Related Software: Indian ERP Market, SAP, Oracle, MS Dynamics, SalesForce CRM. Implementations in India; Articles and Case Studies on ERP Trends like Analytics, Cloud, Digital Transformation, Embedding AI & ML capabilities, Automation, Block-chain, Cybersecurity, IoT, Sustainability and other technology integrations. Explore emerging trends like Autonomous Agents, Gen-AI and Web resources like Gartner Magic Quadrant and Hype Cycle for market stats. 14 hours 1. "Enterprise Resource Planning- Text & Cases", Rajesh Ray, Tata McGraw Hill, New Delhi, 2019 1. "Supply Chain Management: Strategy, Planning and Operation", Sunil Chopra, Pearson Education, 8th Edition, 2025. 2. "Modern ERP: Select, Implement, and Use Today\'s Advanced Business Systems" by Marianne Bradford; Pearson, 4th Edition, 2020. 3. "Enhancing Enterprise Intelligence: Leveraging ERP, CRM, SCM, PLM, BPM, and BI", Vivek Kale, Auerbach Publications, 2016. 4. Ultimate Guide to ERP by TechTarget Identify typical functionality of ERP, SCM & CRM sub-systems. Apply criteria to select ERP Package & Consulting Partner. Systematically develop plans for an ERP Implementation project. Identify critical success factors and associated risks of an ERP Implementation',
      },
    ],
  },
  {
    code: "UE24CS342AB9",
    title: "Design of RTOS",
    dept: "CSE",
    semester: 5,
    credits: 4,
    elective: true,
    endSemInDays: 35,
    description:
      "Tools/Langua ARM GCC, OpenOCD, GDB, Desirable Operating Systems, Microprocessor architecture, C ges C, Assembly Knowledge Have you ever wondered what happens beneath the surface of a while(1) loop, or how a single processor can seemingly do ten things at once without a full operating system like Linux or Windows? The world is rapidly shifting toward smart, connected, and autonomous edge devices-from advanced robotics and automotive control units to wearable IoT sensors.",
    textbooks: [],
    references: [],
    units: [
      {
        title: "Embedded Software Development & Profiling",
        hours: 14,
        topics:
          "Introduction to Embedded Systems: Microcontrollers vs. Microprocessors. The constraints of embedded software. The RTOS landscape ARM Cortex-M4 Architecture: The RISC pipeline, register set (R0-R15), xPSR, and the memory map. The C Runtime & Bootstrapping: Cross-compilation, Linker Scripts, initializing.bss and.data segments. Memory-Mapped I/O: Using volatile pointers in C to manipulate hardware registers. Advanced Peripherals: Serial Communication (UART), SPI, and I2C protocols. Interrupts and Exceptions: The NVIC, Interrupt Service Routines (ISRs), and hardware preemption. Hardware Profiling: Using the Data Watchpoint and Trace (DWT) cycle counter to measure precise interrupt latencies",
      },
      {
        title: "RTOS Core Architecture & Context Switching",
        hours: 14,
        topics:
          "The Process Model: Threads vs. Tasks. Defining the Task Control Block (TCB). Stack Frames & Exception Planting: Understanding the ARM exception stack frame. What hardware auto-pushes (R0-R3, R12, LR, PC, xPSR) vs. what software must save. Planting fake frames in C arrays. Anatomy of a Context Switch: The PendSV exception. Manipulating the Program Counter (PC) and Stack Pointer (SP). FPU Context & Lazy Stacking. Assembly Implementation: Writing inline ARM Thumb-2 Assembly for PendSV to push/pop registers and swap state. Preemptive Scheduling Concepts: Cooperative vs preemptive execution. Time slicing and priority bitmaps for O(1) highest-priority selection. Real-Time Schedulability Theory: Rate Monotonic Scheduling (RMS), utilization bounds, and optimality proofs",
      },
      {
        title: "Concurrency, Synchronization & IPC",
        hours: 14,
        topics:
          'Concurrency Hazards & Atomic Ops: Data corruption, race conditions, and ARM hardware atomic instructions (LDREX/STREX). Synchronization Primitives: Binary and Counting Semaphores. Moving tasks safely between "Ready" and "Blocked" lists. Mutual Exclusion & Priority Inversion: Mutex ownership tracking. The Mars Pathfinder bug and Priority Inheritance Protocol. Jitter & Response-Time Analysis: Sources of software jitter and computing worst-case response times. Inter-Process Communication (IPC): Designing thread-safe FIFO ring buffers. Deadlock & Safe Signaling: Coffman conditions, resource ordering, and ISR-safe signaling APIs without entering the scheduler directly',
      },
      {
        title: "Memory Management, and Power",
        hours: 14,
        topics:
          "Hardware Memory Isolation: Threat modeling and using the ARM Memory Protection Unit (MPU) for task stack isolation. Heap Allocators in RTOS: First-fit fragmentation vs. deterministic Fixed-Block O(1) allocation. Software Timers & Watchdog: One-shot vs periodic timers, Timer Daemon task, and Independent Watchdog (IWDG) integration. Power Management: Tickless Idle theory-stopping the SysTick during idle periods via the WFI instruction and compensating the tick count upon wakeup. Industry Code Study & Benchmarking: Analyzing FreeRTOS source (tasks.c, queue.c). RHEALSTONE benchmark metrics. Testing & Reliability: MISRA-C 2012 guidelines, static analysis tools (cppcheck), and stress testing",
      },
    ],
  },
  {
    code: "UE24CS351B",
    title: "Cloud Computing",
    dept: "CSE",
    semester: 6,
    credits: 5,
    elective: false,
    endSemInDays: 42,
    description:
      "Distributed systems and operating system foundations for the cloud, the cloud control plane, distributed storage, and cloud applications and security.",
    textbooks: ["9780123858801", "9781449373320", "9781119524984"],
    references: [],
    units: [
      {
        title: "Distributed System refresher",
        hours: 14,
        topics:
          "Parallel computing, Grid computing, Introduction to technology challenges with Distributed & Cloud computing, ephemeral nature of compute nodes and its implications in distributed systems, CAP Theorem, Microservices and differences with the traditional monolithic model; challenges of migrating monolithic applications, deployment models, Multi-cloud, Communication using Message queues- Pub Sub model",
      },
      {
        title: "OS refresher and control plane for Cloud",
        hours: 14,
        topics:
          "Hypervisor - Types, Para virtualization and Transparent virtualization, Software - Trap and Emulate virtualization, Software - Binary translation, Goldberg Popek principles for Virtualization, Hardware - AMDv/Intel, Memory - Shadow page tables, Memory - Nested page tables, IO, VM Migration, Cluster coordination - consensus,, Cluster coordination - leader election, distributed locking, Case Study: Zookeeper/Raft - distributed consensus infrastructure. Edge Computing and Fog Computing - principles and paradigms, Orchestration with Kubernetes. Identity and Access Management (IAM)",
      },
      {
        title: "Distributed Storage",
        hours: 14,
        topics:
          "Types of Cloud storage - Block, Object stores, Replication, lag, multileader replication, Leaderless replication, Partitioning - key-value data, Consistent hashing, Partitioning - rebalancing partitions, Request routing, Consistency Models, CAP Theorem, Transactions, SAGA, Two-phase commit",
      },
      {
        title: "Applications on Cloud and Security",
        hours: 14,
        topics:
          "Cloud service models IaaS/PaaS/SaaS,, Microservices, REST, Multitenancy, Multitenant databases. reverse proxies, containerization and automation through Docker and Jenkins. Cloud security requirements - physical/virtual security, security design patterns, Container security features to work with Docker and Kubernetes, Cloud Threats - DDoS, Economic Denial of Sustainability",
      },
    ],
  },
  {
    code: "UE24CS352B",
    title: "Object Oriented Analysis and Design",
    dept: "CSE",
    semester: 6,
    credits: 5,
    elective: false,
    endSemInDays: 49,
    description:
      "In this course students will learn to perform Analysis on a given domain and come up with an Object- Oriented Design (OOD). Various techniques will be discussed and practiced which are commonly used in analysis and design phases in the software industry. Unified Modelling Language (UML) will be used as a tool to demonstrate the analysis and design ideas and an object-oriented programming language such as Java would be used to implement the design.",
    textbooks: ["9780131489066"],
    references: ["9780201633610"],
    units: [
      {
        title: "Advanced OO, Object Oriented Analysis and Static Models and Diagrams",
        hours: 14,
        topics:
          "OOA: Requirements, Modeling and Analysis, Introduction to UML, Use Case Modelling: Use Cases Diagrams. Class Modelling: UML Class Diagrams, OO relationships, CRC Diagrams, Component model, Deployment model, Activity Modelling: UML Activity Diagrams and Modelling, Guidelines. Behaviour Modelling: Sequence Diagram, UML State Machine Diagrams and Models, Advanced State Models",
      },
      {
        title: "Object Orientated Programming",
        hours: 14,
        topics:
          "Object-oriented Programming: JVM, Abstraction, Encapsulation, Composition, Class- Attributes, Behaviour, Objects, and Methods. Interface and Implementation: Role of Constructors and Garbage Collector, Parameter Passing, Value Type and Reference Type, Overloading of Methods, Class Attributes and Behavior: Difference between Class Methods and Instance Methods, Inheritance: method overriding and Interface, Abstract Class, Concepts of Single Rooted Hierarchy - Object Class in Java, Collection, ArrayList and Map; Multithreading",
      },
      {
        title: "Design principles",
        hours: 14,
        topics:
          "OO Development process, System Design and Frameworks, Architectural patterns, MVC architectural pattern, GRASP and its application to Object Design, Creator, Information Expert, Low Coupling, Controller, High Cohesion, Polymorphism, Pure Fabrication, Indirection and Protected Variations.SOLID: Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, Dependency Inversion OO Design Principles and Sample Implementation of Patterns in Java",
      },
      {
        title: "OO Design patterns",
        hours: 14,
        topics:
          "Introduction to Design Patterns, selection and usage of a design pattern, Creational Design Patterns Theory and implementation in Java: Singleton, Factory, Builder and Prototype, Structural Patterns - Adapter, Façade, Proxy and Flyweight, Behavioral Patterns - Chain of Responsibilities, Command, Observer, Strategy",
      },
    ],
  },
  {
    code: "UE24CS341B",
    title: "Compiler Design",
    dept: "CSE",
    semester: 6,
    credits: 4,
    elective: false,
    endSemInDays: 14,
    description:
      "The design and implementation of programming languages continue to evolve as new paradigms, tools, and techniques emerge. Languages and toolchains that fail to adapt become obsolete, making an understanding of compilers essential for the modern Computer Science engineer. Compiler design provides the foundation needed to interpret language constructs, implement language features, and contribute to the evolution of programming languages.",
    textbooks: ["9780321486813"],
    references: ["9781461446989"],
    units: [
      {
        title: "Compilers: Introduction, Lexical Analysis, Top-down Parsers",
        hours: 14,
        topics:
          "The Language Processing System, The Phases of a Compiler, The Grouping of Phases into passes.Lexical Analysis: The Role of the Lexical Analyzer, Input Buffering, Specification of Tokens, Recognition of Tokens, Design of a Lexical Analyzer Generator. The role of the parser, Syntax Error Handling, Error-Recovery Strategies. Top-down parsing: Recursive-Descent Parsing (without backtracking), LL(1) Parser",
      },
      {
        title: "Syntax Analysis: Bottom-up Parsers, Syntax-Directed Translation",
        hours: 14,
        topics:
          "Bottom-up parsing: Shift-Reduce Parsing, viable prefixes, CLR, LALR, Error recovery for Bottom-up parsers Syntax- directed definitions, Evaluation orders for SDD's: S-attributed SDD, L-attributed SDD",
      },
      {
        title: "Implementation of Syntax-Directed Translation Schemes and Intermediate Code",
        hours: 14,
        topics:
          "Generation Applications of Syntax-Directed Translation - SDD for Syntax Trees, Expressions, Basic Types and flow control statements, Type Checking, Syntax-directed Translation Schemes - Parser Stack Implementation of Postfix SDT's, SDT's with actions inside Productions, SDT's for L-Attributed Definitions. Implementing L-Attributed SDD's: Bottom-Up Parsing. Variants ofSyntax Trees - Directed Acyclic Graphs for Expressions, Three-Address Code - Addresses and Instructions, Quadruples, Triples, Indirect Triples, SSA Form, Control Flow Graph",
      },
      {
        title: "Machine Independent Code Optimization, Code Generation and Run Time",
        hours: 14,
        topics:
          "Environment Machine Independent Optimization: Different Optimizations, Optimization of Basic Blocks. Data Flow Analysis: Live-variable analysis, Next-use algorithm. Storage Organization, Different Allocation Strategies, Stack Allocation of space, Access to Non-local Data on the stack. Code Generation: Issues in the design of a code generator, the target language, addresses in the target code, static allocation, stack allocation, run-time addresses for names. A Simple Code generator - The Code generation algorithm, Register allocation problem (Graph coloring)",
      },
    ],
  },
  {
    code: "UE24CS342BA1",
    title: "Supply Chain Management for Engineers",
    dept: "CSE",
    semester: 6,
    credits: 4,
    elective: true,
    endSemInDays: 21,
    description:
      "This course explores supply chain management (SCM) processes. It aims for students to develop the skills to understand, design and evaluate techniques in the realm of supply chain management. It covers fundamentals relevant to SCM, current SCM challenges and trends in the industry including planning and prediction, techniques and tools using AI technologies",
    textbooks: ["9780134731889"],
    references: [],
    units: [
      {
        title: "Introduction to SCM",
        hours: 14,
        topics:
          "Overview of supply chain management and it's key Objectives. Understand supply chain scope, strategic fit, its drivers and performance metrics. Building a strategic framework to analyze Supply Chains. Managing Material and Information flows. Intro to supply chain networks and their design. Various strategies of planning, sourcing, inventory, distribution and logistics related to SCM - Opportunities, Competitive advantage. Value Stream Mapping. Key Drivers - Inventory, Transportation/Logistics, Facilities (Warehousing, Manufacturing plants, Docks), Sourcing/Procurement, Pricing Strategies",
      },
      {
        title: "Procurement and Supply Chain Planning (Demand & Supply)",
        hours: 14,
        topics:
          "Procurement processes, Supplier selection and performance assessments. Intro to Demand Forecasting models, predictive analytics for supply chain planning. Techniques for aggregate planning of demand and supply in supply chains, managing demand variability and accuracy. Case studies",
      },
      {
        title: "Planning and Managing Inventory and Logistics Management in SCM",
        hours: 14,
        topics:
          "Introduction to planning and management of Inventory in an enterprise. Techniques for warehouse management and logistics management for distribution. Logistics stakeholders and modern logistics concepts, Outsourcing logistics, Logistics KPIs like On-Time Delivery, Fill Rate, Inventory Turns, etc. Intro to Reverse Logistics, and Lean Logistics. Enhancing transportation and logistics with real-time tracking and monitoring using IoT and AI-driven route planning and last-mile delivery. Case studies in inventory and logistics management",
      },
      {
        title: "Drivers, Analytics and Current Trends in Supply Chain Management",
        hours: 14,
        topics:
          "Understanding and managing cross functional drivers in supply chain. Decision making in supply chains - sourcing, pricing, risk management and compliance. Basics of AI, Blockchain, IoT concepts applied to SCM. Current trends in SCM: E-procurement, Sustainability, Green SCM, Lean and Global SCM, Real-time, Ethical and Transparent Supply Chains, SCM Analytics, Digital Twin Tech. Exploration of AI & Gen-AI techniques, tools and technologies for enhancing SCM like AI driven Demand Forecasting - Case studies. Awareness of current challenges and research areas of SCM in the industry like Ethical and transparent operations",
      },
    ],
  },
  {
    code: "UE24CS342BA2",
    title: "Algorithms for Information Retrieval",
    dept: "CSE",
    semester: 6,
    credits: 4,
    elective: true,
    endSemInDays: 28,
    description:
      "This course provides a comprehensive introduction to Information Retrieval. By the end of this course, students will gain a strong understanding of how modern information retrieval systems work-from basic keyword-based search to advanced semantic and multimodal retrieval techniques. They will learn how to represent text, images, and audio using embeddings, design efficient retrieval pipelines, and apply neural models for ranking and question answering.",
    textbooks: ["9780521865715", "9780135041963"],
    references: [],
    units: [
      {
        title: "Basics of Information Retrieval",
        hours: 14,
        topics:
          "Introduction to Information Retrieval, Background, Architecture and Strategies of Information Retrieval (IR) Systems, IR Models, Boolean and Extended Boolean Models, Dictionary, Vocabulary, Positional Postings, Phrase Queries and Tolerant Retrieval, Indexing and Vector Space Model, Evaluation of IR Algorithms for Indexing and Index Compression, Vector Space Model for Scoring, tf-idf and Variants",
      },
      {
        title: "Ranking, Web Search Basics and Link Analysis",
        hours: 14,
        topics:
          "Efficient Scoring and Ranking, Parametric and Zone Indexes, Tiered Indexes, Query Term Proximity, Query Parser, Aggregating Scores, Performance Measurement, Web Applications and Search Algorithms, Relevance Feedback, Query Expansion, Other IR Models, Web Search Basics. Economic Model of Web Search, Improving Search Results- Rank Aggregation, Link Analysis, The Page Rank Algorithm, Other Search Algorithms, Scalability Issues in Search. Search User Experience, Web Crawling and Indices, Link analysis, Building a Complete Search System, Lucene as a Search Engine, and Other search engines like Solr, Everything, and Google",
      },
      {
        title: "Semantic Retrieval, Multimedia Information Retrieval",
        hours: 14,
        topics:
          "Word Embeddings- CoBoW, SkipGram,Word2Vec, Sentence Embeddings- Universal Sentence Embeddings, Document Embeddings: Doc2Vec, BERT. Embedding based Reranking: Bi-encoders and Cross Encoders. Multimedia Information Retrieval: Basics of Audio, Image and video representation, Audio features, Audio Information Retrieval, content-based visual information retrieval: metadata searching, Query by Example, Semantic Retrieval, Machine Learning Approaches: Image Embeddings, content comparison using image distance measures, Examples of MIR Query languages. Multimodal Information Retrieval: Introduction, Requirements, Applications, challenges, Fusion Strategies, Vision Language Models: CLIP, VisualBERT, BLIP",
      },
      {
        title: "Question Answering, RAG",
        hours: 14,
        topics:
          "Question Answering, neural models for IR Question Answering, Information Retrieval task, Factoid QA models, Entity Linking models, Knowledge-based QA, and Pretrained models for QA. Retrieval Augment Generation in QA- indexing and generation pipeline, evaluating a RAG system, Advanced RAG strategies",
      },
    ],
  },
  {
    code: "UE24CS342BA3",
    title: "Design of Secure Platform and Systems",
    dept: "CSE",
    semester: 6,
    credits: 4,
    elective: true,
    endSemInDays: 35,
    description:
      "Have you ever wondered what happens between the moment you power on a computer and when the operating system finally takes control? Or how hyperscale datacenters securely manage the power consumption and data transfer of thousands of interconnected processors and accelerators? The Platform and Systems Engineering elective is designed to bridge the critical gap between traditional computer architecture and operating systems.",
    textbooks: [],
    references: [],
    units: [
      {
        title: "The Platform - Boot, Firmware, and Discovery",
        hours: 14,
        topics:
          'The Hardware-Software Interface: Toolchains and Cross-Compilation. The anatomy of an ELF binary. Linker scripts and linking a binary to a specific physical memory address. The C/Assembly Interface: Application Binary Interface (ABI), calling conventions, and stack frame setup. Advanced I/O and Direct Memory Access: Memory-Mapped I/O (MMIO) - using volatile pointers in C to manipulate hardware registers. Direct Memory Access (DMA) - how peripherals independently address memory. Applied Cryptography for Systems Engineers: Crash course in cryptography required for secure boot and attestation. Cryptographic Hash Functions (SHA-256/384). Asymmetric Digital Signatures (RSA/ECDSA). Public Key Infrastructure (PKI) and X.509 Certificates. Threat modeling: Defining the Trusted Computing Base (TCB) against physical vs. software attackers. Introduction to Platform Architecture & The Boot Process: The "Platform" definition (SoC + Board + Firmware). The Boot Sequence: Power-On Reset (POR), ROM, First Stage Bootloader (SPL), Second Stage (U-Boot/GRUB). Legacy BIOS (Real Mode) vs. UEFI (Protected Mode). Reset Vector, Memory Mapping, BSS initialization, Stack setup in Assembly Hardware Description: ACPI vs. Device Tree: How the OS discovers hardware Plug-and-Play, Enumeration, I/O Resource Management ACPI: Tables (RSDP, XSDT, DSDT, MADT). The AML bytecode interpreter in the OS. Device Tree: The DTS syntax (nodes, properties, interrupts, reg). DTB compilation (dtc). Overlays for dynamic hardware. Virtualization and IO virtualization: Introduction to virtualization; CPU, memory virtualization, Introduction to the IOMMU (Input-Output Memory Management Unit) for DMA remapping, and SR-IOV (Single Root I/O Virtualization) distinguishing Physical Functions (PFs) from Virtual Functions (VFs)',
      },
      {
        title: "SoC Architecture and Interconnects",
        hours: 14,
        topics:
          "Advanced Interrupts and Coherency: Moving beyond basic CPU faults. Hardware interrupt controllers (ARM GIC, x86 APIC) and Message Signaled Interrupts (MSI/MSI-X). Cache Coherency: Snooping vs. Directory-based coherency. Deep dive into the MESI state machine (Modified, Exclusive, Shared, Invalid). The System Fabric (NoC and Interconnects): Moving data on the chip. Bus Protocols: AMBA (Advanced Microcontroller Bus Architecture), AXI (Advanced eXtensible Interface). Arbitration, Split transactions, Burst transfers, Coherency (ACE protocol). PCIe Fundamentals, IDE security Intro: Root Complex, Endpoints, Switches, and Bridges. Bus/Device/Function (BDF) addressing. The Threat Model: Physical interposers and malicious switches. Why standard PCIe is vulnerable to observation and injection. Link IDE: Encryption between two directly connected ports. Selective IDE: End-to-end encryption through switches. Compute Express Link (CXL): The Limitation of PCIe- The lack of cache coherency and the latency of DMA. CXL Architecture - Multiplexing three protocols on the PCIe PHY. CXL.io: Discovery, configuration, and legacy I/O (identical to PCIe). CXL.cache: Allowing devices to cache host memory. The MESI protocol states across a serial link. CXL.mem: Allowing the host to access device memory. CXL 2.0/3.0 - Device Types: Type 1: Accelerators without local memory (e.g., SmartNICs). Use CXL.io + CXL.cache. Type 2: Accelerators with local memory (e.g., GPUs). Use all three protocols. Type 3: Memory Expanders. Use CXL.io + CXL.mem",
      },
      {
        title: "Power and Performance Engineering",
        hours: 14,
        topics:
          "The Physics of Computing and Performance Monitoring: Electrical engineering basics for CS students: Voltage, Frequency, and Capacitance. The CMOS Power Equation ($P = C \\cdot V^2 \\cdot f$) and why voltage scaling yields quadratic power savings. Telemetry: Hardware Performance Monitoring Counters (PMCs) and Model-Specific Registers (MSRs). How the CPU physically counts cache misses and cycles. Power Physics and Management Fundamentals: CMOS Power Equation. Dynamic vs. Static Power. Clock Gating, Power Gating. DVFS: Dynamic Voltage and Frequency Scaling. States: C-States (Idle), P-States (Performance), S-States (Sleep/Suspend) Software Power Governors and Scheduling: Linux cpufreq subsystem. Governors: performance, powersave, ondemand, schedutil. Energy Aware Scheduling (EAS) for asymmetric cores (big.LITTLE). Load tracking (PELT), Capacity awareness, Thermal throttling Profiling and Telemetry (RAPL & Perf): Measuring power in software. Intel RAPL (Running Average Power Limit). The powercap framework. Using perf for hardware events (cycles, instructions, cache misses) and turbostat",
      },
      {
        title: "Platform Security",
        hours: 14,
        topics:
          'Roots of Trust and Measured Boot: RoT for Measurement (RTM), RoT for Storage (RTS), and RoT for Reporting (RTR). Measured Boot and TPM - Extending hash measurements into Platform Configuration Registers (PCRs). The difference between "Secure Boot" (Verification) and "Measured Boot" (Recording). Supply Chain Security - The problem of counterfeit hardware and mutable firmware attacks. Device Identifier Composition Engine (DICE): The TCG DICE architecture for IoT and constrained devices. The Power-on-Latch mechanism, Unique Device Secret (UDS), and how the firmware uses a Key Derivation Function (KDF) to combine the UDS with the hash of the next software layer to generate a Compound Device Identifier (CDI). Security Protocol and Data Model (SPDM): A standard protocol for device authentication over any transport (PCIe, MCTP, USB). Foundation for zero-trust architectures by enabling secure chip-to-chip (S2C) communication and verifying attached peripherals before they are utilized. SPDM protocol overview. Introduction to Trusted Execution Environments (TEE): Isolation Models. Least Privilege, Attack Surface Reduction, Side-channel risks. ARM TrustZone: System-wide isolation (Secure vs Normal world). The NS-bit on the AXI bus. RISC V TEE models. RISC V Process-Level TEEs: Keystone and Penglai: Architecture of process-level secure enclaves on open architectures. Keystone: The Security Monitor (SM) executing in M-mode, using PMP to carve out isolated, contiguous physical memory regions for the enclave (Runtime + User App), inaccessible to the hosting Linux OS. Penglai: User-mode enclave systems, leveraging optional hardware extensions like sPMP (Supervisor PMP) and Guarded Page Tables for scalable secure resources. Integration with OpenSBI dynamic domains. Hardware Vulnerabilities and Mitigations: When Hardware Fails. Speculative Execution attacks (Spectre, Meltdown). Rowhammer (DRAM disturbance). Speculation barriers, Cache flushing, Kernel Page Table Isolation (KPTI)',
      },
    ],
  },
  {
    code: "UE24CS342BA4",
    title: "Generative AI and its Applications",
    dept: "CSE",
    semester: 6,
    credits: 4,
    elective: true,
    endSemInDays: 42,
    description:
      "Generative Artificial Intelligence and Large Language Models are transforming the field of Artificial Intelligence by enabling machines to understand, reason, and generate human-like text, images, audio, and code. Technologies such as prompt engineering, Retrieval-Augmented Generation, parameter-efficient fine-tuning, multimodal models, and agentic workflows are driving innovations in healthcare, education, finance, legal systems, scientific research, and enterprise automation.",
    textbooks: ["9781098103217", "9781098107963", "9781098150969"],
    references: [],
    units: [
      {
        title: "NLP Basics, Pre-Trained Models",
        hours: 14,
        topics:
          "Introduction to GenAI and its Applications, Large Language Models (LLMs), Evolution of LLMs. Tokenization-Introduction, Techniques-BPE, Word Piece, Sentence Piece, Numerical Problems. Word Embeddings - Introduction, Types of Word Embeddings: TF-IDF, Word2Vec - CBoW & SkipGram, GloVe, Numerical Problems. Transformer- Anatomy and Architecture, Numericals on Self and Cross Attention Score computation. Introduction to Pre-trained Models, Exploring BERT and GPT Architectures, Variants of BERT: ELMo, ROBERTa, BART. NLP Basics: Terminologies, N-Gram Models, POS, NER. NLP Tasks: Text Classification, Summarization, Question Answering, Machine Translation",
      },
      {
        title: "Prompt Engineering, Basic and Advance RAG",
        hours: 14,
        topics:
          "Prompt Engineering - Overview and Applications. Prompt Structure, Hard and Soft Prompts, Prompt Engineering Techniques - Zero Shot, One Shot, Few Shot Prompting, Chain of Thought, Tree of Thought, Graph of Thought Prompting, Vector Stores RAG-Introduction, Need for RAG, Naïve RAG, Sparse Retrieval-BM25, Challenges Indexing - Flat Index, Inverted File Index, Hierarchical Navigable Small World, Product Quantization. Advanced RAG- Introduction, Need, Retrieval Enhancement Techniques - Introduction, Sparse Retrieval-BM25, Dense Retrieval-ColBERT/SBERT, Hybrid Retrieval using BM25 and ColBERT/SBERT, Re-Ranking, Query Expansion, Numericals on Hybrid Search, Generation Enhancement Techniques- Introduction, Techniques, Multi-Stage Retrieval, Advanced RAG Architectures including self- reflective, corrective, graph-based, multimodal, adaptive, and agentic retrieval systems for reliable generative AI applications",
      },
      {
        title: "Fine Tuning and Multimodal LLMs",
        hours: 14,
        topics:
          "Fine Tuning - PEFT: Introduction to LLM Fine Tuning, Data Resolution, Precision, Quantization, LLM Pre-training, Fine Tuning Principles, Parameter-Efficient and Alignment-based Fine-Tuning Techniques for LLMs including LoRA, QLoRA, DoRA, SoRA, Adapter Tuning, Instruction Fine Tuning, Prompt Tuning, DPO, ORPO, GRPO, and Multimodal Fine-Tuning approaches. Introduction to Multimodal Models, Exploring CLIP and BLIP, Whisper AI-Architecture, Applications. Mixture of Experts",
      },
      {
        title: "Agentic Workflow and Evaluation",
        hours: 14,
        topics:
          "Agentic Development Life Cycle, Agentic Workflow and Design Patterns - Planning-based agent systems, Tool-augmented reasoning, Multi-step Task Decomposition, Memory-augmented agents, Agentic RAG, Self-Reflection and Self-Critique loops, Multi-agent collaboration and coordination, Hierarchical agents, Dynamic prompt generation, Function calling and Tool orchestration, Autonomous Decision-making pipelines, Iterative reasoning loops (ReAct-style), Workflow state management, Long-term memory integration, Agent evaluation and benchmarking, Frameworks for building Agentic Workflow- Lang Chain, LangGraph, Design of AI Harness, LLM Evaluation Techniques. Data behind LLM, LLM Ethics, LLM Security,Recent Developments in LLM",
      },
    ],
  },
  {
    code: "UE24CS342BA5",
    title: "Blockchain",
    dept: "CSE",
    semester: 6,
    credits: 4,
    elective: true,
    endSemInDays: 49,
    description:
      "This course offers a comprehensive understanding of Blockchain technology, covering its foundational concepts, data integrity, cryptographic techniques, and network structures. Students will explore key blockchain models, consensus algorithms, smart contracts, and second-generation applications like DApps and DAOs. Through hands-on demonstrations, including wallet creation and transactions, learners gain practical skills in working with platforms like Etherscan and Hyperledger Fabric.",
    textbooks: [],
    references: [],
    units: [
      {
        title: "Introduction and Data flow and Integrity",
        hours: 14,
        topics:
          "Key Blockchain Concepts, Nodes, Cryptocurrency, tokens, Public Ledger, Peer to peerNetwork, Types of Blockchain, Permissioned Blockchain model-Hyperledger Fabric: Architecture and core components, Permission-less Blockchain model- Demonstration of ether scan and Goerli/Sepoliaetherscan. Types of cryptography, Digital signatures, Hash functions, SHA-256, Patterns of hashing, Hash Pointer, Merkle tree. Case study: Bitcoin Blockchain Network, Creation of metamask wallets and performing transactions",
      },
      {
        title: "The structure of the network: consensus algorithm",
        hours: 14,
        topics:
          "Introduction to distributed consensus: What, why, Challenges, Proof of Work, Proof of Stake, Delegated Proof of Stake, Proof of Authority, Proof of Elapsed Time, Proof of Space, Proof of Burn, RAFT, PAXOS, Byzantine Fault Tolerance System, Pratical BFT. Smart contracts: origins and how they function, Understanding a sample contract, Decentralized applications, Decentralized Autonomous Organizations (DAOs)- Need, Principal agent dilemma, components, The DAO Story, Legality of DAPPs and DAOs, Legal challenges (India/global)",
      },
      {
        title: "Second generation applications of Blockchain technology",
        hours: 14,
        topics:
          "Solidity- Variable, Functions, Arrays/Strings, enum/structs, mapping, storage/memory, function visibility - public, private, internal, external,modifiers, view, pure, fallback, overloading, in-built mathematical cryptography functions",
      },
      {
        title: "Blockchain Application Development, Security, and Performance Optimization",
        hours: 14,
        topics:
          "SOLIDITY- Withdrawal pattern, Restricted Access, ether units. Creation of a simple DAPP. Gas mechanism in Ethereum, basic gas optimization techniques, Scalability solutions - Rollups (Optimistic and ZK), Sidechains vs Layer 2, Implications for decentralized application deployment. Blockchain vulnerabilities, Smart contract vulnerabilities, Blockchain based DNS security platform, Use cases: Public Sector, Finance, Supply Chain. Research Aspects in Blockchain",
      },
    ],
  },
  {
    code: "UE24CS342BA6",
    title: "Digital Forensics and Incident Response",
    dept: "CSE",
    semester: 6,
    credits: 4,
    elective: true,
    endSemInDays: 14,
    description:
      "Digital Forensics is the core set of principles and processes necessary to produce usable digital evidence and uncover critical intelligence. This course provides a deep understanding of techniques to gather, protect, analyze, and report digital confirmations through a combination of theoretical foundation and practical exercises. The content is organized into four units, each with a focused objective and corresponding outcomes",
    textbooks: ["9780128016350"],
    references: [],
    units: [
      {
        title: "Introduction to Digital Forensics and Incident Response",
        hours: 14,
        topics:
          "Foundations of Digital Forensics: Introduction to forensic science and digital forensics, Goals, categories, forensic readiness, life cycle, and challenges, Role of the examiner; types of investigations; importance of international standards Incident Response: Attack lifecycle and introduction to incident response, Building an Incident Response Team and drafting an Incident Response Plan (IRP), Forensic tools and methodologies for initial response, Investigations Triad Evidence Acquisition and Analysis: Types of digital evidence (HDD, SSD, RAM), Data recovery, allocated vs. unallocated space, and persistence (page/swap files), Major Concepts, Essential Technical Concepts Initial responder tasks: search and seizure, documentation, packaging, and transporting evidence Labs & Activities: Activity 1: Understanding and familiarization with Digital Forensic Lab 1: Acquiring digital evidence (HDD/SSD and RAM) with open-source tools Lab 2: Analysing digital evidence (HDD/SSD and RAM) with open-source tools",
      },
      {
        title: "Windows Forensics - Filesystems and Registry Analysis",
        hours: 14,
        topics:
          "Windows File Systems: Overview of FAT and NTFS file systems, Examination of file allocation structures and metadata, Techniques for timeline analysis and file recovery Windows Registry Analysis: Key artifacts: Deleted data, hibernation file (Hiberfile.sys), print spooling, recycle bin, metadata, thumbnail cache, Most Recently Used (MRU) lists, restore points, and shadow copies, Methods for recovering deleted registry keys and performing registry forensics Labs & Activities: Activity 2: Case study using tools like Autopsy for practical Windows forensics Lab 3: Data recovery and forensic analysis using EXIF Tool Lab 4: Examination of the Windows Registry with REGEDIT and open-source forensic tools",
      },
      {
        title: "Linux, macOS, Network, and Browser Forensics",
        hours: 14,
        topics:
          "Linux Forensics: Linux file systems (Ext2/Ext3), structure layers (file, metadata, data unit), and artifacts, Concepts such as deleted data recovery, logical volume management, boot processes, and principles of file carvingmacOS Forensics: Exploration of OS X file system artifacts, including HFS+ structures and OS X system logsNetwork Forensics: Fundamentals of networking and types of networks, Techniques for securing network infrastructures, analyzing network evidence, and applying forensic science to networks, Tools and processes for the seizure and analysis of networking devices Browser Forensics: Overview of web browsers (IE, Firefox, Chrome), Forensic analysis of browser artifacts and investigation tools Labs & Activities: Activity 3: Practical session on understanding Linux artifacts using both CLI and GUI tools Lab 5: Analysis of PCAP files and network forensic investigations Lab 6: Browser forensic investigations using open-source tools",
      },
      {
        title: "Email, Mobile Forensics, Anti-Forensics, and Report Writing",
        hours: 14,
        topics:
          "Email Forensics: Examination of email communications, protocols, and header analysis, Techniques for recovering and analyzing email evidence Mobile Device Forensics: Architecture, boot processes, and the forensic significance of cellular network data, Procedures related to SIM file systems, device locks, rooting, and jailbreaking Methods for evidence acquisition and challenges associated with mobile devices Anti-Forensics: Overview and classification of anti-forensics techniques, Practices including data wiping, shredding, obfuscation, encryption, and data hiding Report Writing: Preparing and structuring forensic reports best practices for report design, documentation, legal acceptance, and presenting digital evidence Labs & Activities: Lab 7: Email forensics using open-source tools Lab 8: Demonstration of mobile forensics techniques Activity 4: Collaborative report writing exercise and peer review",
      },
    ],
  },
  {
    code: "UE24CS342BA7",
    title: "Digital Twin",
    dept: "CSE",
    semester: 6,
    credits: 4,
    elective: true,
    endSemInDays: 21,
    description:
      "Digital Twins are revolutionizing how we design, monitor, and optimize complex systems by creating dynamic virtual replicas of physical entities. This course introduces the foundational concepts, modeling techniques, and simulation strategies needed to build and analyze Digital Twins across domains such as healthcare, manufacturing, and transportation. Students will gain hands-on experience with tools like Unity, Blender, and OpenGL, while also exploring critical topics like 3D view synthesis and cybersecurity.",
    textbooks: ["9780136062127"],
    references: [],
    units: [
      {
        title: "Digital Twin Essentials",
        hours: 14,
        topics:
          "The Big Picture of Digital Twins, History of the Digital Twin, Origin of the Digital Twin concept, Digital Twin and Product Life cycle Relationship, Types of Digital Twin: Discrete Vs Composite, Product versus facility, Types of Digital Twin: Simulation versus operational, Analytics versus physics-based, Characteristics of a Digital Twin, Digital Twin Architecture, Industrial Digital Twin applications, Examples of mock, functional, and executable twins, Data Driven Modelling, Physics Driven Modelling, Hybrid (Data-Physics) Modelling, Examples of Physics Driven Modelling: DT of a Propeller of a Drone, DT of a ceiling fan, Bio-Mechanical DT of human body; Examples of Data Driven Modelling: DT for RUL of a Battery, DT for traffic Mobility in Bangalore, DT of RUL of GUT; Hybrid Modelling: Heart Digital Twin, DT for Solar Array, DT for CAR using OBD., Case Study: Manufacturing, Case Study: Healthcare, Case Study: Buildings, Case Study: Transportation & Logistics",
      },
      {
        title: "Foundations and Techniques in 3D View Synthesis",
        hours: 14,
        topics:
          "Manual 3D modelling and mesh editing, Point cloud to mesh conversion, Poisson surface reconstruction, Ball-pivoting algorithm, Alpha shapes and Delaunay triangulation, Camera models and calibration, Epipolar geometry and depth estimation, Structure from Motion (SfM), Multi-View Stereo (MVS), Depth Image-Based Rendering (DIBR), Forward and backward image warping, Neural Radiance Fields (NeRF) fundamentals, Volume rendering with MLPs, 3D Gaussian Splatting for real-time rendering",
      },
      {
        title: "System Modelling and Simulation",
        hours: 14,
        topics:
          "Introduction to Simulation, System and System Environment, Discrete Event System Simulation, General Principles, The Event Scheduling/Time Advance Algorithm, Input Modelling, Estimation of Absolute Performance, Verification, Calibration and Validation",
      },
      {
        title: "Digital Twin & Cyber Security",
        hours: 14,
        topics:
          "Digital twins and cybersecurity, Security Framework, Digital twins threat modelling, Common attacks on digital twins, Common attacks on digital twins, Digital twin authentication and identification challenge, IDS, IPS, Authentication Methods, Communication Channel Protection, building cyber resilience in digital twins, Privacy Framework, Lack of Privacy, and trust, Privacy by Design, Enhancing trust with block chain integration",
      },
    ],
  },
  {
    code: "UE24CS342BA8",
    title: "Responsible AI",
    dept: "CSE",
    semester: 6,
    credits: 4,
    elective: true,
    endSemInDays: 28,
    description:
      "AI is transforming cybersecurity through intelligent threat detection and automation. However, it also introduces risks such as bias, misuse, and adversarial attacks. This course explores both AI capabilities and responsible, secure usage in cybersecurity",
    textbooks: ["9783030303709", "9780244768522"],
    references: [],
    units: [
      {
        title: "Foundations, lifecycle and real-world risks",
        hours: 14,
        topics:
          "Responsible AI principles - Fairness, accountability, transparency, safety, and trustworthiness; Societal impact of AI systems across domains; AI system lifecycle - Design, development, deployment, monitoring, and continuous evaluation of AI systems; Integration of Responsible AI principles across lifecycle stages; Interpretability and Transparency - Understanding how AI systems make decisions and making decision processes explainable to humans; Evaluating explainability methods and their limitations; Consistency and Robustness - Ensuring predictable behavior across inputs; Identifying instability and edge-case failures; Alignment Problem - Ensuring AI systems behave according to human intent; reward mis-specification and specification gaming; Advanced AI risk concepts - Instrumental Convergence (power-seeking, deception, resource acquisition behaviors), goal misgeneralization, unintended optimization; Understanding AGI - Definition, capabilities, current progress, and debates on timelines and feasibility; Privacy and Fairness in AI - Bias sources, fairness metrics, trade-offs; privacy risks in data-driven systems; Human-AI interaction risks - Automation bias, over-reliance, hallucination acceptance, trust calibration; Real-world AI failures - Case studies across sectors highlighting bias, privacy violations, and unsafe deployment",
      },
      {
        title: "Adversarial Machine Learning - attacks and defenses",
        hours: 14,
        topics:
          "Introduction to adversarial machine learning - Threat models, attacker goals, and attack surfaces in ML systems; Evasion attacks - Crafting adversarial examples to mislead models at inference time; Poisoning attacks - Training-time attacks through data manipulation and backdoor insertion; Model extraction and inversion attacks - Stealing model parameters and inferring sensitive training data; Membership inference attacks - Privacy leakage from trained models; Robustness and generalization issues - Sensitivity of models to perturbations and distribution shifts; Defense strategies - Adversarial training, input preprocessing, certified robustness, and anomaly detection; Secure ML pipeline design - Data integrity, training safeguards, and validation mechanisms; Evaluation of adversarial robustness - Metrics and testing strategies for secure ML systems",
      },
      {
        title: "LLM vulnerabilities and security in Generative AI systems",
        hours: 14,
        topics:
          "Introduction to LLM-specific security risks - Differences between traditional ML and Generative AI threat models; Prompt injection attacks - Direct and indirect injection, instruction override, and context manipulation; Jailbreaking techniques - Bypassing safety mechanisms and generating restricted outputs; Data leakage and privacy risks - Extraction of sensitive information through prompts and context exploitation; Hallucinations and reliability failures - Confident incorrect outputs, fabrication, and reasoning errors; Context handling vulnerabilities - Instruction drift, long-context failures, and prioritization errors; Security risks in tool-integrated and agent-based systems - Tool misuse, cross-component attacks, and multi- agent vulnerabilities; AI-assisted offensive security - Use of LLMs in generating attacks, phishing, and exploit development; Mapping LLM threats using MITRE ATLAS; Defense strategies - Input/output filtering, prompt hardening, secure system design, monitoring, and red teaming of LLM systems; Case studies of advanced AI systems (e.g., Claude Mythos) to analyze emergent behavior, alignment challenges, and security vulnerabilities",
      },
      {
        title: "AI Governance, Ethics and societal impact",
        hours: 14,
        topics:
          "Regulatory and governance landscape for AI - Digital Personal Data Protection Act 2023 and Recent Developments; General Data Protection Regulation, EU AI Act, US AI policy directions and executive initiatives Compliance, auditing, and accountability - Risk classification, documentation, auditing mechanisms, and governance processes; Ethical design and deployment practices - Ethical approvals, informed consent, participatory design, and stakeholder inclusion; Responsible AI in key domains: Legal domain - Bias, explainability, accountability, Healthcare domain - Safety, fairness, privacy, reliability, Education domain - Personalization risks and over-automation, Other domains - Finance, hiring, and governance systems Policy issues in Responsible AI - Innovation vs regulation, accountability, liability, and ethical trade-offs across domains; Responsible AI in the Indian context - Public sector AI, data governance challenges, digital inclusion, and regulatory considerations; Future of work and AI - Impact of automation, human-AI collaboration, workforce transformation, and ethical implications; Sustainable and cost-aware AI deployment - Efficient system design, resource optimization, and environmental considerations",
      },
    ],
  },
  {
    code: "UE24CS342BA9",
    title: "Quantitative Trading Systems",
    dept: "CSE",
    semester: 6,
    credits: 4,
    elective: true,
    endSemInDays: 35,
    description:
      "This course is built for CSE students with an engineering first mindset. The emphasis is 80% quant development (systems, implementation, C++ performance, financial algorithms in code) and 20% finance theory. By the end, students will have an in-depth understanding of financial systems that operate on nanosecond latency scales",
    textbooks: ["9780195144703", "9781491903995", "9781292410654"],
    references: [],
    units: [
      {
        title: "Systems Foundations & Financial Data Structures",
        hours: 14,
        topics:
          "Market Microstructure & the Order Book, C++ Memory Model for Performance, Limit Order Book Implementation in C++, NASDAQ ITCH 5.0 Feed Handler",
      },
      {
        title: "Quantitative Methods & Statistical Engines",
        hours: 14,
        topics:
          "Probability, Statistics & Numerical Methods, Time Series Analysis: Stationarity, AR Models & Volatility, Options Pricing: Black-Scholes, Statistical Arbitrage: Cointegration to Signal",
      },
      {
        title: "Strategy Infrastructure & Back testing Systems",
        hours: 14,
        topics:
          "Backtesting Engine Architecture, Momentum & Pairs Trading Strategies, Performance Analysis & Avoiding Overfitting (Deflated Sharpe Ratio, Purged K-Fold CV). Case studies of advanced AI systems (e.g., Claude Mythos) to analyse emergent behaviour, alignment challenges, and security vulnerabilities",
      },
      {
        title: "HFT Systems, Market Making & Capstone",
        hours: 14,
        topics:
          "Concurrency & Lock-Free Data Structures (SPSC Ring Buffer), Kernel Bypass Networking & HFT Infrastructure, Avellaneda-Stoikov Market Making Model, Systems Design",
      },
    ],
  },
  {
    code: "UE24CS342BA10",
    title: "Quantum Machine Learning and Algorithms",
    dept: "CSE",
    semester: 6,
    credits: 4,
    elective: true,
    endSemInDays: 42,
    description:
      "Quantum Machine Learning (QML) sits at the confluence of two transformative disciplines: quantum information processing and modern machine learning. This advanced course equips students to design, implement, and critically evaluate supervised quantum learning algorithms on near-term NISQ hardware. Beginning with quantum data-encoding strategies, the course progresses through variational quantum circuits, kernel methods, and quantum neural networks before broadening to generative models and reinforcement learning.",
    textbooks: ["9783319964232"],
    references: ["9781107002173"],
    units: [
      {
        title: "Quantum Data Encoding",
        hours: 14,
        topics:
          "Introduction, Background, How quantum computers can classify data, Computational complexity of learning, Sample complexity, Model complexity, Information Encoding: Basic Encoding, Amplitude Encoding, Qsample Encoding, Hamiltonian Encoding. Encoding Strategies in PennyLane",
      },
      {
        title: "Quantum Computing for Inference and Training",
        hours: 14,
        topics:
          "Linear Models, Kernal Methods, Probabilistic Models, Quantum Bias, Search and Amplitude Amplification, Hybrid training for Variational Algorithms, Quantum Adiabatic Machine Learning",
      },
      {
        title: "Learning with Quantum Models",
        hours: 14,
        topics:
          "Quantum Extensions of Ising-Type Models, Variational Classifiers and Neural Networks, Other Approaches to Build Quantum Models",
      },
      {
        title: "Quantum Neural Networks",
        hours: 14,
        topics:
          "Parameterised Quantum Circuits (PQC) & Ansatz Design, Gradient Estimation - Parameter-Shift Rule, Quantum Neural Networks (QNN) - Architecture, Training QNNs - Optimisation Landscape, Hybrid Classical-Quantum Pipelines, Noise Models & Error Mitigation, VQC Classification & Regression in PennyLane / Qiskit",
      },
    ],
  },
  {
    code: "UE24CS343BB1",
    title: "Heterogeneous Parallelism",
    dept: "CSE",
    semester: 6,
    credits: 4,
    elective: true,
    endSemInDays: 49,
    description:
      "This course focuses on parallel heterogeneous architecture as well as programming models and imparts pragmatic skills to program using parallel programming languages and frameworks trending in the industry",
    textbooks: ["9780128141205", "9783031289231"],
    references: ["9780128119051", "9780323912310"],
    units: [
      {
        title: "Fine Grained Parallelism",
        hours: 14,
        topics:
          "Review on Parallelism and Performance, Instruction Level Parallelism and Enhancement Techniques, Prediction and Speculation, Cache optimized, Cache coherency, Programming. Laws of Parallelism, Data, Task and Pipeline Parallelism, Pthreads",
      },
      {
        title: "Coarse Grained Parallelism",
        hours: 14,
        topics:
          "Parallel Algorithms for regular architecture - Mesh, Pyramids, Task Decompositions and Mapping, Multithreaded and Multi-Core architectures, Many-Core Heterogeneous Architectures, GPU Architectures",
      },
      {
        title: "Parallelism Frameworks",
        hours: 14,
        topics:
          "OpenMP, Race Conditions, Deadlocks & Debugging, Memory Models for Parallel Programming, Memory Consistency Models",
      },
      {
        title: "GPU Programming & Hardware Accelerators",
        hours: 14,
        topics:
          "CUDA Programming Frameworks, Introduction to Nvidia/SIMT, AI math(matrix multiplication) using systolic arrays and TPU.Hardware acceleration platforms (FPGAs and TPUs), Architecture and organization of modern FPGAs, HLS Programming, Case Studies",
      },
    ],
  },
  {
    code: "UE24CS343BB2",
    title: "Topics in Deep Learning",
    dept: "CSE",
    semester: 6,
    credits: 4,
    elective: true,
    endSemInDays: 14,
    description:
      "Deep learning architectures, recurrent networks and transformers, generative models and advanced paradigms such as reinforcement learning.",
    textbooks: ["9783031296413"],
    references: ["9781098125974", "9780387310732"],
    units: [
      {
        title: "Introduction to Deep Learning",
        hours: 14,
        topics:
          "Activation functions, loss functions- Loss function- For Balanced Datasets, Categorical Cross-Entropy Loss, Sparse Categorical Cross-Entropy, Hinge Loss for Imbalanced Datasets- Weighted Cross-Entropy Loss, Focal Loss, Dice Loss, Batch Normalization, Regularization and Optimization, Convolution Architectures - Alexnet, ZFNet, VGGNet, GoogleNet, ResNet. RCNN, FRCNN, Faster RCNN, YOLO. Transfer Learning: Introduction, Motivation, Variations, TL Architecture of CNNs. Mixture of Experts",
      },
      {
        title: "Recurrent Neural Networks (RNN) and Transformers",
        hours: 14,
        topics:
          "Introduction-Recurrent Neurons, Memory Cells, Variable-Length Input-Output Sequences, RNN Architecture, Sequence learning problem, BPTT-Back Propagation Through Time, truncated BPTT, Vanishing and Exploding Gradient, Bidirectional RNN, LSTM Cell and GRU Cell, Text Classification with RNN, Encoder/Decoder architecture, Seq2Seq model with Attention, Transformer architectures including self- attention, encoder-decoder models, Introduction to Vision Transformers",
      },
      {
        title: "Generative Models and Advanced Representation Learning",
        hours: 14,
        topics:
          "Introduction to Autoencoders, Regularization in autoencoders, Denoising autoencoders, Sparse autoencoders, Contrastive autoencoders, Variational Auto Encoders(VAEs). Generative Adversarial Networks(GANs)- Architecture and Training Methods, Image Generation, DCGAN, Style GAN, WGAN, Applications. Diffusion Model, Stable diffusion architectures. Meta Learning: Introduction to Meta Learning, MAML, FOMAML, Adaptive Neural inductive Learning, Siamese Networks. Graphical Neural Networks (GNN): Introduction to GNNs, Graph Convolution Networks, Applications",
      },
      {
        title:
          "Advanced Learning Paradigms: Reinforcement Learning, Federated Learning, TinyML, and",
        hours: 14,
        topics:
          "Explainable AI Introduction, Basic Framework of RL, Learning to Optimize Rewards, Credit Assignment Problem, Temporal Difference, Learning and Q Learning. Deep RL: Deep Q Learning. Federated Learning: Horizontal, Vertical and FTL (Federated Transfer Learning). Tiny ML: Model optimization (quantization, pruning, knowledge distillation), resource-efficient neural networks, and data handling for edge devices (sensor-based time- series data preprocessing). Explainable AI (XAI) - Introduction and need for interpretability, model transparency vs explainability, feature importance methods, SHAP, LIME, saliency maps, Grad-CAM, attention visualization, rule-based explanations, surrogate models, counterfactual explanations, evaluation metrics for explainability",
      },
    ],
  },
  {
    code: "UE24CS343BB3",
    title: "Database Technologies",
    dept: "CSE",
    semester: 6,
    credits: 4,
    elective: true,
    endSemInDays: 21,
    description:
      "The last decade saw enormous advancements in the design of large-scale data processing systems due to the rise of Internet services. This course covers the architecture of modern data management systems. Topics include storage management, query optimization, distributed, parallel and stream processing, with a focus on the key design ideas shared across many types of data intensive systems",
    textbooks: ["9780131354289", "9781491944240"],
    references: [],
    units: [
      {
        title: "Relational Data Model and Storage Formats and Indexing",
        hours: 14,
        topics:
          "Review of Relational Design Theory Relational Algebra. Secondary Storage Management: The Memory Hierarchy, Flash Storage and Database Buffer, Architecture, Accelerating Access to Secondary Storage, Disks and Disk Failures, Arranging Data on Disk, Block and Record Addresses, Variable-Length Data and Records Column Stores, Record Modifications. Index Structures: Concepts, Types of Indexes, B+ Tree Indexes, Hash Tables, Multidimensional Data and Indexes -key Indexes and R-trees, Bitmap Indexes, Indexes in SQL",
      },
      {
        title: "Query Processing and Optimization",
        hours: 14,
        topics:
          "Query Execution: Physical-Query-Plan Operators, One-Pass Algorithms and Two-Pass Algorithms (based on Sorting and Hashing), Clustered and Non-clustered indexes, Buffer Management. The Query Compiler: Parsing and Preprocessing, Algebraic Laws for Improving Query Plans, From Parse Trees to Logical Query Plans, Cost based Plan Selection, Choosing an Order for Joins",
      },
      {
        title: "Parallel and Distributed Databases",
        hours: 14,
        topics:
          "Avenues for Parallelism: Parallel Database Architectures, Models of Parallelism, Intra-query and Inter-query Parallelism, Parallel Algorithms on Relations. Distributed Databases Distributed Data Storage, Types, Advantages, Data Fragmentation and Replication, Distributed Transactions, Distributed Query Processing, Distributed Commit Two-phase Commit, Distributed Locking, Distributed Catalog Management, Concurrency Control, Peer-to-Peer Distributed Search Chord Circles",
      },
      {
        title: "Data Stream Management & Trends in Database Systems",
        hours: 14,
        topics:
          "Introducing Stream Processing, Stream Processing Model, Streaming Architectures, Apache Model, Apache Kafka, and Amazon Kinesis. Introduction to multi-model databases and memory optimized tables. Current Trends in Database Systems and Decision Support Systems; Data Warehousing and Data Mining Applications; Introducing Data Lake and Data Fabric",
      },
    ],
  },
  {
    code: "UE24CS343BB4",
    title: "Machine Learning on Graphs",
    dept: "CSE",
    semester: 6,
    credits: 4,
    elective: true,
    endSemInDays: 28,
    description:
      "This course introduces the students to the three meta landscapes of representation, optimization, and objective for the learning tasks on graph data. Graphs are ubiquitous in almost everything today -in social graphs, large-scale biological systems, road networks, polypharmacy, and user-item relations. Graphs, being non-Euclidean, require different machine-learning approaches. This course starts by exploring graph features for traditional machine learning on graphs and discussing a few noteworthy classical graph ML approaches.",
    textbooks: ["9783031015885", "9781108831741"],
    references: [],
    units: [
      {
        title: "Traditional machine learning on graphs",
        hours: 14,
        topics:
          "Types of complex Graphs and computational tasks on Graphs. Graph Features for traditional machine learning- Node-level features. Graph kernel features- Graphlet & Motif, Weis Feiler-Lehman kernel. Measures for neighborhood overlap. Graph clustering and spectral methods -Graph Laplacians, Graph Cuts and clustering, Spectral clustering. Encoder-Decoder perspective - encoder, decoder, and optimization of the encoder-decoder model. Factorization based approaches",
      },
      {
        title: "Graph Representation Learning Based on Shallow Embedding Methods",
        hours: 14,
        topics:
          "Random Walk-based embedding -DeepWalk and Node2Vec. Limitations of shallow embedding. Shallow embedding in multi-relational Knowledge Graph- embedding as a reconstruction task, loss function, and decoders. Knowledge Graph Completion Task-TransE, TransR, DistMult, ComplEx. Semi- supervised Learning on Graph - Label Propagation Algorithm and Label Spreading Algorithm",
      },
      {
        title: "Graph Learning Using Graph Neural Network",
        hours: 14,
        topics:
          "Vanilla GNN - Neural message passing framework. Generalized neighborhood aggregation. Generalized update methods. Graph Convolution Networks (GCN): Spectral GCN, LGCN, and GraphSAGE), Multi- relational GCN and Graph Attention Networks (GAT), Graph Transformer, Graph pooling. Expressiveness, designing Maximally expressive GNNs, and Expressive Power by aggregate functions. Applications and loss functions",
      },
      {
        title: "Deep Generative Models, GNN on complex graphs, and interdisciplinary applications",
        hours: 14,
        topics:
          "Deep Generative models on graph - Variational autoencoder on the graph, Generative adversarial network on the graph, Auto-regressive methods. GNN on complex graphs - Heterogeneous GNN, Dynamic GNN, Hypergraph GNN. Application of GNN to Biology and Chemistry, Interdisciplinary Applications of GNN: Unstructured data - Text and Image. Structured Data - Social Network, Recommender System, Cyber Security. An introduction to trustworthy graph AI, Meta-Learning perspectives of graph ML",
      },
    ],
  },
  {
    code: "UE24CS343BB5",
    title: "Embedded System Programming with MicroPython",
    dept: "CSE",
    semester: 6,
    credits: 4,
    elective: true,
    endSemInDays: 35,
    description:
      "Programming microcontrollers in MicroPython: digital and analogue interfacing, sensors and communication protocols, networking and IoT.",
    textbooks: ["9781491972731"],
    references: [],
    units: [
      {
        title: "Getting Started with MicroPython and Microcontrollers",
        hours: 14,
        topics:
          "Introduction to Embedded Systems and MicroPython, Overview of Microcontrollers (Pyboard, ESP8266, ESP32, micro:bit),Setting up the Development Environment:FlashingMicroPython firmware, Using REPL, WebREPL, and editors (Thonny, Mu),MicroPython Syntax Review: Basic Python features (control structures, data types, functions),Working with the Filesystem, Executing scripts on boot (boot.py and main.py) Lab Activities: LED blink and GPIO toggling Button input and LED output Running Python scripts using REPL and script files",
      },
      {
        title: "Digital and Analog Interfacing with Hardware",
        hours: 14,
        topics:
          "Digital Inputs/Outputs (GPIO),Pull-up/down resistors and debounce logic,Using PWM (Pulse Width Modulation),Analog Input and Output using ADC/DAC,MicroPython modules: machine, time, and utime, Creating reusable modules, Timer-based programming and event loops Lab Activities: Dim an LED using PWM Read a potentiometer using ADC Build a tone generator with PWM and DAC Debounced button-controlled LED",
      },
      {
        title: "Sensor Interfacing and Communication Protocols",
        hours: 14,
        topics:
          "Understanding serial communication basics, I2C, SPI, and UART in MicroPython, Interfacing common sensors (temperature, light, accelerometer), Working with displays (OLED, LCD), Using external libraries and drivers, Managing asynchronous data streams Lab Activities: Display sensor readings on an OLED via I2C Communicate between two devices using UART Read accelerometer data using SPI Develop a multi-sensor data display system 14 hours",
      },
      {
        title: "Networking and IoT with MicroPython",
        hours: 14,
        topics:
          "Introduction to IoT with MicroPython, Wi-Fi networking and internet access, Creating HTTP servers and web APIs, Using MQTT protocol for data publishing, Sending sensor data to cloud platforms (ThingSpeak, Adafruit IO), Remote device control via mobile/web interface Lab Activities: Build a Wi-Fi-connected temperature logger Create a web server to control LEDs via browser Use MQTT to publish and subscribe sensor data Final Project: Complete IoT-enabled embedded system Recommended Hardware: Microcontroller: Pyboard, ESP32, BBC micro:bit Components: LEDs, resistors, buttons, temperature sensors (e.g., TMP36, DHT11), OLED display, potentiometer, buzzer, jumper wires, breadboard, USB cable",
      },
    ],
  },
  {
    code: "UE24CS343BB6",
    title: "Information Security",
    dept: "CSE",
    semester: 6,
    credits: 4,
    elective: true,
    endSemInDays: 42,
    description:
      "Privilege escalation, secure coding, threat modelling and web vulnerabilities, malware analysis and penetration testing.",
    textbooks: ["9781733003902"],
    references: ["9781292066172"],
    units: [
      {
        title: "Introduction and Privilege Escalation Attacks",
        hours: 14,
        topics:
          "Security Concepts and Relationships. Use cases and Misuse cases, Misuse case legend, Security use case vs Misuse case, Secure Software Development Life Cycle (SDL). Basics of Linux for Security, Set- UID program: Need for privileged programs, Set-UID mechanism, Superman story, Attack surfaces, Invoking other surfaces, Principle of least privilege. Environment variables and attacks: Environment variables, Attack surface, Attacks via Dynamic linker, External program, and Library. Lab: Set-UID program & Environment variables and attacks. Buffer overflow attack-I: Program memory layout, Stack and function invocation, Stack buffer-overflow attack Hours: 14",
      },
      {
        title: "Secure Coding",
        hours: 14,
        topics:
          "Buffer overflow attack-II and Shellcode:, Attacks with Unknown address and Buffer size, Shellcode, Countermeasures & Defeating it. Return-to-libc, Return-oriented programming. Format string vulnerability: Introduction to functions and format string, Vulnerable program, Exploiting the vulnerability, Code injection attack, Countermeasures. Race-condition vulnerability, Case study: Target case study. Hours: 14",
      },
      {
        title: "Threat modelling and Web Vulnerabilities",
        hours: 14,
        topics:
          "SSRF, Broken Access Control, JWT attacks, OAuth / authentication flaws, API security. Threat Modelling: Trust Boundaries, Attack Surfaces, Modelling Methods: STRIDE model and variants. Case study: Apple - Privacy vs Safety. Hours: 14",
      },
      {
        title: "Malware Analysis and Penetration Testing",
        hours: 14,
        topics:
          'Malware: its types, analysis: Static and Dynamic, MorrisWormAttack, Reverse engineering basics (IDA/Ghidra), Penetration testing: Introduction, Benefits, Drawbacks. Hours: 14 "Computer & Internet Security: A Hands-on Approach", Wenliang Du, 2nd Edition/3rd Edition. 1: "Computer Security: Principles and Practice", William Stallings and Lawrie Brown, Pearson Education, 3rd Edition, 2014. 2: "Secure Programming with Static Analysis", Brian Chess and Jacob West, Pearson Education, 2007 At the end of this course, the student will be able to: Identify possible misuse cases in the context of software development. Defend against various attacks and how to write secure code. Apply threat modelling techniques to expose inherent vulnerabilities in applications. Design and develop secure web applications. Exploit software vulnerabilities and launch attacks',
      },
    ],
  },
  {
    code: "UE24CS343BB7",
    title: "Mobile and Autonomous Robot",
    dept: "CSE",
    semester: 6,
    credits: 4,
    elective: true,
    endSemInDays: 49,
    description:
      "This course provides an introduction to autonomous robots, focusing on the principles and techniques behind their design, programming, and control. Students will explore key topics such as perception, planning, and navigation, while gaining hands-on experience through projects and simulation using ROS/ROS2. The course combines theoretical foundations with practical applications across both terrestrial and aerial robotic platforms",
    textbooks: ["9780262015356", "9780262201629"],
    references: [],
    units: [
      {
        title: "Introduction to Robotics",
        hours: 14,
        topics:
          "Robotics overview: Past, Present and Future; Sensors for Robots (Visual and inertial measurements: Gyroscope, accelerometers, IMU, GPS, Range sensors, and LiDAR.) AI in Robotics: Machine Learning Basics for Robotics. ROS overview: ROS/ROS2 for robotics, ROS architecture and communication protocols, ROS packages for robot hardware control",
      },
      {
        title: "Locomotion and Perception",
        hours: 14,
        topics:
          "Introduction to Locomotion: The basics of SOTA locomotion systems, Legged Robots, Wheeled Robots, Aerial Robots. Robot Kinematics, Introduction to Perception, camera vision, Fundamentals of Computer Vision and Image Processing and filtering, Feature Extraction: Object detection and Place Recognition, Stereo vision and 3D perception, Feature Extraction Based on Range Data (Laser, Ultrasonic)",
      },
      {
        title: "Localization",
        hours: 14,
        topics:
          "Introduction and Challenges of Localization, To Localize or Not to Localize, Belief Representation, Map representation, Probabilistic Map-Based Localization: Markov localization, Kalman Filter localization, Autonomous Map Building: SLAM, EKF SLAM, Particle filter SLAM, GraphSLAM, Open challenges in SLAM",
      },
      {
        title: "Planning and Navigation",
        hours: 14,
        topics:
          "Introduction Path Planning and Navigation, Path planning: Graph search and Potential field path planning. Obstacle avoidance: Bug algorithm, Vector field histogram, bubble band technique, Curvature velocity techniques, Dynamic window approaches. Navigation Architectures. Revisiting Navigation using Reinforcement Learning and Imitation learning: A Robotics Perspective, Applications and Social Implications",
      },
    ],
  },
  {
    code: "UE24CS343BB8",
    title: "Cybersecurity in Cloud",
    dept: "CSE",
    semester: 6,
    credits: 4,
    elective: true,
    endSemInDays: 14,
    description:
      "This course focuses on the essentials of Cloud security and offers a practical exposure to securely create or access the cloud services. The course emphasizes on securing data and applications in a public cloud environment",
    textbooks: ["9781492037514"],
    references: [],
    units: [
      {
        title: "Cloud Security Essentials and IAM in Public Cloud Infrastructure",
        hours: 14,
        topics:
          "Introduction to Cloud Computing, IaaS, PaaS and SaaS and Service models, Private/Public/ Hybrid and Multi Cloud models, Introduction to Cloud Security, NIST Cyber security Framework, Shared Responsibility Model-cloud Provider and Cloud Customer, Cloud Security Fundamentals-Types of Misconfigurations. IAM Life cycle, Building and Managing IAM in AWS, Access Policy and Authentication",
      },
      {
        title: "Network and Data Security in Public Cloud Infrastructure",
        hours: 14,
        topics:
          "Zero trust architecture in Single Cloud/Hybrid/Multi Cloud infrastructure. AWS Network Security: Amazon VPC security groups, AWS shield, AWS Firewall Manager, AWS Network firewall, Network ACLs, DNS firewall, Data Security- Securing data at rest, Data Security- Securing data at transit, Data in process",
      },
      {
        title: "Securing Cloud Applications in Public Cloud Infrastructure",
        hours: 14,
        topics:
          "Container services, what is Microservice Architecture? Challenges of Microservice Architecture, Service Mesh Architecture, Serverless Architecture/Framework, FaaS, CI/CD Pipeline, DevSecOps. Secure IaC",
      },
      {
        title: "Cloud Security Governance",
        hours: 14,
        topics:
          "Cloud Controls Matrix (CCM) - cybersecurity control framework for cloud computing, CIS (Center for Internet Security) Critical Security Controls, Cloud logging and Auditing, Overview of CSPM, CWPP Solutions, Security guidance for critical areas of focus in cloud computing by CSA (Cloud Security alliance), Case Study: Exploration of AWS Cloud Security Dashboard",
      },
    ],
  },
  {
    code: "UE24CS343BB9",
    title: "Quantum Computer System Design",
    dept: "CSE",
    semester: 6,
    credits: 4,
    elective: true,
    endSemInDays: 21,
    description:
      "Quantum programming, quantum algorithms and architectures, the software stack and noisy intermediate-scale quantum machines.",
    textbooks: ["9783031006371", "9781107002173"],
    references: [],
    units: [
      {
        title: "Quantum Programming",
        hours: 14,
        topics:
          "Postulates of Quantum Mechanics: State representation, unitary time evolution, and projective measurements. Quantum Information Theory: No-cloning theorem, dense coding, quantum teleportation, and quantum parallelism. Quantum Programming Models: Working with Quantum Instruction Set Architectures (Q-ISA) and executing programs on real quantum backends using modern SDKs like IBM Qiskit",
      },
      {
        title: "Quantum Algorithms and Quantum Architecture",
        hours: 14,
        topics:
          "Arithmetic and Signal Processing: Quantum Fourier Transform (QFT), Quantum Phase Estimation (QPE). Quantum Complexity Theory: Bounded-Error Quantum Polynomial-time (BQP) and connections to classical complexity classes. The Quantum Compiler: Compiling higher-level quantum code to physical gates; gate synthesis and approximation (e.g., Solovay-Kitaev algorithm)",
      },
      {
        title: "Quantum Architecture and the Software Stack",
        hours: 14,
        topics:
          "Qubit Mapping and Routing: Solving hardware connectivity constraints, SWAP gate insertion, and layout-aware scheduling. Classical-Quantum Control: Microarchitecture for classical and quantum control; managing coherence limits. Instruction Set Architectures (ISA): Designing interfaces that map logical operations to hardware- native physical gates",
      },
      {
        title: "Noisy Intermediate-Scale Quantum (NISQ) & Error Correction",
        hours: 14,
        topics:
          "Quantum Noise: Decoherence, gate errors, readout errors, and T1 / T2 relaxation times. Error Mitigation and Characterization: Randomized benchmarking, cross-entropy benchmarking, and dynamical decoupling. Quantum Error Correcting Codes (QECC): Classical linear codes, stabilizer codes, surface codes, and concatenated codes. Fault-Tolerant Computation: Threshold theorem and fault-tolerant gate operations",
      },
    ],
  },
  {
    code: "UE24CS343BB10",
    title: "Video Processing and Understanding",
    dept: "CSE",
    semester: 6,
    credits: 4,
    elective: true,
    endSemInDays: 28,
    description:
      "Video processing fundamentals, segmentation and motion estimation, and modern video understanding.",
    textbooks: ["9780133991000"],
    references: ["9783030343712"],
    units: [
      {
        title: "Fundamentals of Video Processing",
        hours: 14,
        topics:
          "Introduction to digital video: Spatial resolution and frame rate, color spaces (RGB, YUV), video enhancement techniques (denoising, sharpening), video sampling and interpolation, video formats and compression techniques (H.264 (MPEG-4 AVC)), frame extraction and representation (I-frames, P-frames, B-frames), separating audio and video from an input video",
      },
      {
        title: "Video segmentation, motion estimation, and tracking",
        hours: 14,
        topics:
          "Video segmentation: Scene cut detection, spatio-temporal segmentation, Motion Detection and estimation (frame differencing, background subtraction, optical flow methods: Lucas-Kanade, Horn-Schunck), Spatial Feature extraction: 2D CNN, Skeletal keypoint detection, Temporal feature extraction: 3D CNN, temporal pooling, Object tracking: Kalman filter, DeepSORT",
      },
      {
        title: "Video Understanding-1",
        hours: 14,
        topics:
          "Key frame extraction and scene segmentation, video-based object recognition: YOLOV++, semantic segmentation in video and its challenges: SAM2, pose estimation (for blurring of faces for privacy, analyzing human movement, orienting a robot for navigation, etc.), extraction and processing text content in video (for indexing and retrieval), audio and video semantic analysis, scene understanding",
      },
      {
        title: "Video Understanding-2",
        hours: 14,
        topics:
          "Action Recognition: C3D, R2+1 D, MViTv2, Anomaly recognition: Real-time anomaly detection in dynamic environments, GNN for activity recognition, vision language models: video captioning, visual question answering and reasoning, visual dialog: video CLIP, LLAVA",
      },
    ],
  },
  {
    code: "UE24CS342BB12",
    title: "SOC and Threat Intelligence",
    dept: "CSE",
    semester: 6,
    credits: 4,
    elective: true,
    endSemInDays: 35,
    description:
      "Security operations centres, log management and monitoring, threat detection and intelligence, and incident response.",
    textbooks: [],
    references: [],
    units: [
      {
        title: "Fundamentals of Cyber Defense and SOC Operations",
        hours: 14,
        topics:
          "Introduction to Cybersecurity: CIA Triad, Threat Actors, Vulnerability vs. Risk.Network & OS Foundation: TCP/IP, Common Protocols (HTTP, DNS, DHCP).Windows Event Logs & Linux Syslogs (basic log types).SOC Structure & Tools: Tier 1, 2, 3 Roles, Daily Workflow, Key Metrics (MTTD, MTTR).Introduction to SOC Tools: SIEM, Ticketing, EDR (Conceptual)",
      },
      {
        title: "Log Management and Security Monitoring (SIEM Essentials)",
        hours: 14,
        topics:
          "Log Sources & Collection: Log types (Firewall, Endpoint, OS), Log Normalization Security Information and Event Management (SIEM): SIEM Architecture (Collectors, Database, Correlator - simplified view).Basic Search Query Language and syntax.Alert Triage and Handling: Alert lifecycle, False Positives/True Positives.Basic Correlation Rules (Conceptual design)",
      },
      {
        title: "Threat Detection and Threat Intelligence",
        hours: 14,
        topics:
          'Cyber Threat Intelligence (CTI) Basics: CTI Sources and Types (Tactical, Operational), Indicators of Compromise (IoCs) and Indicators of Attack (IoAs), Adversarial Tactics & Models: MITRE ATT&CK Framework (Introduction).Cyber Kill Chain (Basic Phases),Introduction to Threat Hunting: Difference between Alerts and Hunting.Simple Hunt Hypotheses (e.g., "Is PowerShell being used unusually?")',
      },
      {
        title: "Incident Response and Containment",
        hours: 14,
        topics:
          "Incident Response (IR) Lifecycle: Preparation, Identification, Containment, Eradication, Recovery Lessons, Incident Prioritization and Classification (Severity, Impact), Chain of Custody, Data Acquisition (Disk & Memory - simplified),Security Automation (SOAR Basics): Introduction to SOAR, Need for Automation and Response Playbooks",
      },
    ],
  },
];
