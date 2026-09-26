/**
 * Textbooks and references prescribed by the 2026 B.Tech CSE syllabus, beyond
 * the curated catalogue. Editions, ISBN-13s, publishers and years were checked
 * against Open Library; page counts are the publisher's where known. Chapter
 * lists are given for the books students reach for most, with summaries in our
 * own words; the rest carry a description, which the book-level index covers.
 */

import type { BookSeed, CategorySeed, ChapterSeed } from "./catalogue-data";

const ch = (no: number, title: string, summary: string): ChapterSeed => ({ no, title, summary });

export const SYLLABUS_PUBLISHERS: { name: string; city: string; website?: string }[] = [
  { name: "No Starch Press", city: "San Francisco", website: "https://nostarch.com" },
  { name: "W. W. Norton", city: "New York", website: "https://wwnorton.com" },
  { name: "PHI Learning", city: "New Delhi" },
  { name: "Khanna Publishers", city: "New Delhi" },
  { name: "Alpha Science", city: "Oxford" },
  { name: "CRC Press", city: "Boca Raton", website: "https://www.routledge.com" },
  { name: "Cisco Press", city: "Indianapolis" },
  { name: "Apress", city: "New York", website: "https://www.apress.com" },
  { name: "Packt Publishing", city: "Birmingham", website: "https://www.packtpub.com" },
  { name: "Morgan & Claypool", city: "San Rafael" },
  { name: "Elsevier", city: "Amsterdam", website: "https://www.elsevier.com" },
  { name: "Rooted Grove", city: "Atlanta" },
  { name: "Lulu", city: "Morrisville" },
];

export const SYLLABUS_CATEGORIES: CategorySeed[] = [
  { slug: "programming", name: "Programming", parent: "computer-science" },
  { slug: "data-science", name: "Data science and visualisation", parent: "computer-science" },
  {
    slug: "distributed-systems",
    name: "Distributed and cloud computing",
    parent: "computer-science",
  },
  { slug: "graphics-hci", name: "Graphics, vision and interaction", parent: "computer-science" },
  { slug: "robotics", name: "Robotics and embedded systems", parent: "computer-science" },
  { slug: "quantum-computing", name: "Quantum computing", parent: "computer-science" },
  { slug: "operations", name: "Operations and supply chain", parent: "management" },
  { slug: "finance", name: "Finance and markets", parent: "management" },
];

export const SYLLABUS_BOOKS: BookSeed[] = [
  {
    title: "Think Python",
    subtitle: "How to Think Like a Computer Scientist",
    authors: ["Allen B. Downey"],
    category: "programming",
    rack: "CS-05",
    description:
      "A first programming book that teaches Python by building up from variables and functions to recursion, data structures and classes, with an eye on how programmers reason. Freely available online under a Creative Commons licence.",
    tags: ["python", "open-access"],
    editions: [
      {
        isbn13: "9781098155438",
        editionNo: 3,
        publisher: "O'Reilly Media",
        year: 2024,
        pages: 326,
        totalChapters: 19,
        chapters: [
          ch(
            1,
            "Programming as a Way of Thinking",
            "What a program is, arithmetic and values in Python, and running code in a notebook.",
          ),
          ch(
            2,
            "Variables and Statements",
            "Assignment, variable names, expressions versus statements and importing modules.",
          ),
          ch(
            3,
            "Functions",
            "Defining and calling functions, parameters, local variables and stack diagrams.",
          ),
          ch(
            4,
            "Functions and Interfaces",
            "Designing small functions with clear interfaces through turtle drawing, encapsulation and refactoring.",
          ),
          ch(
            5,
            "Conditionals and Recursion",
            "Boolean expressions, if statements, recursion, base cases and infinite recursion.",
          ),
          ch(
            6,
            "Return Values",
            "Functions that return results, incremental development, boolean functions and recursion with return values.",
          ),
          ch(
            7,
            "Iteration and Search",
            "For and while loops, updating variables, and searching through words and strings.",
          ),
          ch(
            8,
            "Strings and Regular Expressions",
            "String slicing and methods, immutability, and pattern matching with regular expressions.",
          ),
          ch(
            9,
            "Lists",
            "Lists as mutable sequences, list methods, aliasing, and passing lists to functions.",
          ),
          ch(
            10,
            "Dictionaries",
            "Key-value mappings, counting with dictionaries, looping over items and memoisation.",
          ),
          ch(11, "Tuples", "Tuples, tuple assignment, zip, and using tuples as dictionary keys."),
          ch(
            12,
            "Text Analysis and Generation",
            "Counting words, frequency analysis and generating random text from Markov chains.",
          ),
          ch(
            13,
            "Files and Databases",
            "Reading and writing files, paths, formatted output and storing data with shelve.",
          ),
          ch(
            14,
            "Classes and Functions",
            "Programmer-defined types, attributes, and pure functions versus modifiers.",
          ),
          ch(
            15,
            "Classes and Methods",
            "Methods, the init method, operator overloading and printing objects.",
          ),
          ch(
            16,
            "Classes and Objects",
            "Objects that contain objects, copying, and equality versus identity.",
          ),
          ch(
            17,
            "Inheritance",
            "Representing playing cards, class attributes, inheritance and class diagrams.",
          ),
          ch(
            18,
            "Python Extras",
            "Sets, counters, default dictionaries, conditional expressions, comprehensions and generators.",
          ),
          ch(19, "Final Thoughts", "Where to go next as a programmer and how to keep learning."),
        ],
      },
    ],
  },
  {
    title: "Automate the Boring Stuff with Python",
    subtitle: "Practical Programming for Total Beginners",
    authors: ["Al Sweigart"],
    category: "programming",
    rack: "CS-05",
    description:
      "Python for people who want to get everyday work done: the language basics, then programs that rename files, scrape web pages, fill spreadsheets, send email and read documents. Free to read online.",
    tags: ["python", "open-access", "automation"],
    editions: [
      {
        isbn13: "9781718504509",
        editionNo: 3,
        publisher: "No Starch Press",
        year: 2025,
        pages: 672,
        totalChapters: 24,
        chapters: [
          ch(
            1,
            "Python Basics",
            "Expressions, data types, variables and a first program in the interactive shell.",
          ),
          ch(
            2,
            "if-else and Flow Control",
            "Boolean values, comparison operators and branching with if, elif and else.",
          ),
          ch(3, "Loops", "While and for loops, range, break and continue, and importing modules."),
          ch(
            4,
            "Functions",
            "Defining functions, return values, None, scope and handling exceptions.",
          ),
          ch(
            5,
            "Debugging",
            "Raising exceptions, assertions, logging and stepping through code with a debugger.",
          ),
          ch(6, "Lists", "List indexing and slicing, list methods, references and sequence types."),
          ch(
            7,
            "Dictionaries and Structuring Data",
            "Dictionaries, nested data structures and modelling real things as data.",
          ),
          ch(
            8,
            "Strings and Text Editing",
            "String methods, formatting and manipulating text and the clipboard.",
          ),
          ch(
            9,
            "Text Pattern Matching with Regular Expressions",
            "Finding phone numbers and emails with regular expressions, groups and substitution.",
          ),
          ch(
            10,
            "Reading and Writing Files",
            "Paths, opening and writing files and saving variables between runs.",
          ),
          ch(
            11,
            "Organizing Files",
            "Copying, moving, renaming and compressing files and walking directory trees.",
          ),
          ch(
            12,
            "Designing and Deploying Command Line Programs",
            "Writing scripts that run from the terminal with arguments and virtual environments.",
          ),
          ch(
            13,
            "Web Scraping",
            "Downloading pages with requests and parsing HTML to pull out data.",
          ),
          ch(
            16,
            "SQLite Databases",
            "Creating tables, inserting and querying rows with Python's built-in SQLite module.",
          ),
          ch(
            18,
            "CSV, JSON, and XML Files",
            "Reading and writing structured data in the common interchange formats.",
          ),
        ],
      },
    ],
  },
  {
    title: "Fluent Python",
    subtitle: "Clear, Concise, and Effective Programming",
    authors: ["Luciano Ramalho"],
    category: "programming",
    rack: "CS-05",
    description:
      "An advanced guide to idiomatic Python: the data model, sequences and mappings, functions as objects, classes and protocols, generators, concurrency and metaprogramming.",
    tags: ["python"],
    editions: [
      {
        isbn13: "9781492056355",
        editionNo: 2,
        publisher: "O'Reilly Media",
        year: 2022,
        pages: 983,
        totalChapters: 24,
        chapters: [],
      },
    ],
  },
  {
    title: "How to Solve It by Computer",
    authors: ["R. G. Dromey"],
    category: "programming",
    rack: "CS-05",
    description:
      "A classic on algorithmic problem solving for beginners: breaking problems down, fundamental algorithms on numbers and arrays, merging, sorting, searching and text processing, worked step by step.",
    tags: ["problem-solving"],
    editions: [
      {
        isbn13: "9788131705629",
        editionNo: 1,
        publisher: "Pearson",
        year: 2007,
        pages: 464,
        totalChapters: 9,
        chapters: [],
      },
    ],
  },
  {
    title: "C Programming: A Modern Approach",
    authors: ["K. N. King"],
    category: "programming",
    rack: "CS-05",
    description:
      "A thorough introduction to C89 and C99 that explains not just the language but why it behaves as it does, from expressions and pointers to program organisation and the standard library.",
    tags: ["c"],
    editions: [
      {
        isbn13: "9780393979503",
        editionNo: 2,
        publisher: "W. W. Norton",
        year: 2008,
        pages: 832,
        totalChapters: 27,
        chapters: [
          ch(
            1,
            "Introducing C",
            "The history and strengths of C, its weaknesses and how to use it effectively.",
          ),
          ch(
            2,
            "C Fundamentals",
            "Writing, compiling and running a simple program; directives, functions, statements and variables.",
          ),
          ch(
            3,
            "Formatted Input/Output",
            "printf and scanf, conversion specifications and how input is matched.",
          ),
          ch(
            4,
            "Expressions",
            "Arithmetic, assignment and increment operators, precedence and evaluation order.",
          ),
          ch(
            5,
            "Selection Statements",
            "Logical expressions, the if statement and the switch statement.",
          ),
          ch(6, "Loops", "while, do and for loops, exiting loops, and the null statement."),
          ch(
            7,
            "Basic Types",
            "Integer and floating types, characters, type conversion and typedef.",
          ),
          ch(
            8,
            "Arrays",
            "One-dimensional and multidimensional arrays, initialisers and variable-length arrays.",
          ),
          ch(
            9,
            "Functions",
            "Defining and calling functions, arguments, return, recursion and program termination.",
          ),
          ch(
            10,
            "Program Organization",
            "Local and external variables, blocks, scope and organising a program.",
          ),
          ch(
            11,
            "Pointers",
            "Pointer variables, the address and indirection operators, and pointers as arguments.",
          ),
          ch(
            12,
            "Pointers and Arrays",
            "Pointer arithmetic, processing arrays with pointers and array names as pointers.",
          ),
          ch(
            13,
            "Strings",
            "String literals and variables, reading and writing strings and the string library.",
          ),
          ch(
            14,
            "The Preprocessor",
            "Macro definitions, conditional compilation and other preprocessor directives.",
          ),
          ch(
            15,
            "Writing Large Programs",
            "Source and header files, dividing a program into files and building it.",
          ),
          ch(
            16,
            "Structures, Unions, and Enumerations",
            "Defining and using structures, nested data, unions and enumerations.",
          ),
          ch(
            17,
            "Advanced Uses of Pointers",
            "Dynamic memory allocation, linked lists, pointers to pointers and function pointers.",
          ),
          ch(
            22,
            "Input/Output",
            "Streams, file operations, formatted, character and block I/O and file positioning.",
          ),
        ],
      },
    ],
  },
  {
    title: "C How to Program",
    subtitle: "With Case Studies Introducing Applications and Systems Programming",
    authors: ["Paul Deitel", "Harvey Deitel"],
    category: "programming",
    rack: "CS-05",
    description:
      "A live-code introduction to C with hundreds of complete programs, covering control statements, functions, arrays, pointers, strings, structures, files and data structures, plus secure C programming notes.",
    tags: ["c"],
    editions: [
      {
        isbn13: "9781292437071",
        editionNo: 9,
        publisher: "Pearson",
        year: 2022,
        pages: 1056,
        totalChapters: 15,
        chapters: [],
      },
    ],
  },
  {
    title: "Digital Design and Computer Architecture",
    authors: ["David Money Harris", "Sarah L. Harris"],
    category: "digital-design",
    rack: "EC-02",
    description:
      "Takes the reader from transistors and logic gates through sequential circuits and hardware description languages to designing a working MIPS processor and its memory system.",
    tags: ["digital-logic", "verilog", "processor-design"],
    editions: [
      {
        isbn13: "9780123944245",
        editionNo: 2,
        publisher: "Morgan Kaufmann",
        year: 2013,
        pages: 720,
        totalChapters: 8,
        chapters: [
          ch(
            1,
            "From Zero to One",
            "Abstraction, binary and hexadecimal numbers, logic gates, logic levels and CMOS transistors.",
          ),
          ch(
            2,
            "Combinational Logic Design",
            "Boolean equations and algebra, Karnaugh maps, multiplexers, decoders and timing.",
          ),
          ch(
            3,
            "Sequential Logic Design",
            "Latches and flip-flops, synchronous design, finite state machines and timing constraints.",
          ),
          ch(
            4,
            "Hardware Description Languages",
            "Modelling combinational and sequential circuits in SystemVerilog and VHDL, and testbenches.",
          ),
          ch(
            5,
            "Digital Building Blocks",
            "Adders, comparators, ALUs, shifters, counters, fixed and floating point, and memory arrays.",
          ),
          ch(
            6,
            "Architecture",
            "Instruction set architecture: registers, instructions, addressing modes and machine language.",
          ),
          ch(
            7,
            "Microarchitecture",
            "Single-cycle, multicycle and pipelined processors, hazards and performance.",
          ),
          ch(
            8,
            "Memory and I/O Systems",
            "Caches, virtual memory, memory-mapped I/O and embedded I/O systems.",
          ),
        ],
      },
    ],
  },
  {
    title: "Data Structures Using C and C++",
    authors: ["Yedidyah Langsam", "Moshe J. Augenstein", "Aaron M. Tenenbaum"],
    category: "algorithms",
    rack: "CS-01",
    description:
      "A classic data structures text implemented in C and C++: stacks, recursion, queues, linked lists, trees, sorting, searching, graphs and storage management.",
    tags: ["data-structures", "c"],
    editions: [
      {
        isbn13: "9788120311770",
        editionNo: 2,
        publisher: "PHI Learning",
        year: 2000,
        pages: 672,
        totalChapters: 9,
        chapters: [
          ch(
            1,
            "Introduction to Data Structures",
            "Information and abstract data types, arrays and structures in C and classes in C++.",
          ),
          ch(
            2,
            "The Stack",
            "Stack operations, array implementation, and evaluating and converting infix and postfix expressions.",
          ),
          ch(
            3,
            "Recursion",
            "Recursive definitions and programs, simulating recursion and writing recursive algorithms.",
          ),
          ch(
            4,
            "Queues and Lists",
            "Queues, priority queues, singly, doubly and circular linked lists and their operations.",
          ),
          ch(
            5,
            "Trees",
            "Binary trees, traversals, binary search trees, Huffman coding and representing general trees.",
          ),
          ch(
            6,
            "Sorting",
            "Exchange, selection, insertion, merge, quick and heap sort with efficiency analysis.",
          ),
          ch(
            7,
            "Searching",
            "Sequential and binary search, tree searching, balanced trees and hashing.",
          ),
          ch(
            8,
            "Graphs and Their Applications",
            "Graph representations, traversals, shortest paths, spanning trees and flow problems.",
          ),
          ch(
            9,
            "Storage Management",
            "Dynamic memory, garbage collection, compaction and buddy systems.",
          ),
        ],
      },
    ],
  },
  {
    title: "Linear Algebra and Its Applications",
    authors: ["Gilbert Strang"],
    category: "linear-algebra",
    rack: "MA-01",
    description:
      "Strang's applied linear algebra: elimination, vector spaces, orthogonality, determinants, eigenvalues, positive definite matrices and numerical computation, with an emphasis on why the ideas matter.",
    tags: ["linear-algebra"],
    editions: [
      {
        isbn13: "9788131501726",
        editionNo: 4,
        publisher: "Cengage Learning",
        year: 2006,
        pages: 487,
        totalChapters: 8,
        chapters: [
          ch(
            1,
            "Matrices and Gaussian Elimination",
            "Solving linear systems by elimination, matrix notation, LU factorisation and inverses.",
          ),
          ch(
            2,
            "Vector Spaces",
            "Subspaces, solving Ax equals b, linear independence, basis, dimension and the four fundamental subspaces.",
          ),
          ch(
            3,
            "Orthogonality",
            "Orthogonal vectors and subspaces, projections, least squares and the Gram-Schmidt process.",
          ),
          ch(4, "Determinants", "Properties and formulas for determinants and their applications."),
          ch(
            5,
            "Eigenvalues and Eigenvectors",
            "Diagonalisation, difference and differential equations, and similarity.",
          ),
          ch(
            6,
            "Positive Definite Matrices",
            "Minima, tests for positive definiteness and the singular value decomposition.",
          ),
          ch(
            7,
            "Computations with Matrices",
            "Matrix norms, condition numbers and iterative methods for eigenvalues and systems.",
          ),
          ch(
            8,
            "Linear Programming and Game Theory",
            "Linear inequalities, the simplex method, duality and two-person games.",
          ),
        ],
      },
    ],
  },
  {
    title: "Linear Algebra and Its Applications",
    authors: ["David C. Lay", "Steven R. Lay", "Judi J. McDonald"],
    category: "linear-algebra",
    rack: "MA-01",
    description:
      "An introductory linear algebra course built around applications, from linear systems and matrix algebra to eigenvalues, orthogonality, least squares and quadratic forms.",
    tags: ["linear-algebra"],
    editions: [
      {
        isbn13: "9780321982384",
        editionNo: 5,
        publisher: "Pearson",
        year: 2016,
        pages: 576,
        totalChapters: 8,
        chapters: [
          ch(
            1,
            "Linear Equations in Linear Algebra",
            "Systems of equations, row reduction, vector equations, linear independence and linear transformations.",
          ),
          ch(
            2,
            "Matrix Algebra",
            "Matrix operations, inverses, LU factorisation, subspaces, dimension and rank.",
          ),
          ch(
            3,
            "Determinants",
            "Computing determinants, their properties, Cramer's rule, volume and linear maps.",
          ),
          ch(
            4,
            "Vector Spaces",
            "Vector spaces and subspaces, null and column spaces, bases, coordinates and change of basis.",
          ),
          ch(
            5,
            "Eigenvalues and Eigenvectors",
            "The characteristic equation, diagonalisation, complex eigenvalues and dynamical systems.",
          ),
          ch(
            6,
            "Orthogonality and Least Squares",
            "Inner products, orthogonal projections, Gram-Schmidt, least squares and linear models.",
          ),
          ch(
            7,
            "Symmetric Matrices and Quadratic Forms",
            "Diagonalising symmetric matrices, quadratic forms and the singular value decomposition.",
          ),
          ch(
            8,
            "The Geometry of Vector Spaces",
            "Affine combinations, convex sets, hyperplanes and polytopes.",
          ),
        ],
      },
    ],
  },
  {
    title: "Statistics for Engineers and Scientists",
    authors: ["William Navidi"],
    category: "probability-statistics",
    rack: "MA-03",
    description:
      "Applied probability and statistics for engineering students: describing data, distributions, confidence intervals, hypothesis tests, regression and designed experiments, with real data sets throughout.",
    tags: ["statistics"],
    editions: [
      {
        isbn13: "9781259717604",
        editionNo: 5,
        publisher: "McGraw-Hill Education",
        year: 2019,
        pages: 944,
        totalChapters: 10,
        chapters: [
          ch(
            1,
            "Sampling and Descriptive Statistics",
            "Sampling, summary statistics and graphical summaries of data.",
          ),
          ch(
            2,
            "Probability",
            "Basic ideas, counting, conditional probability, independence and random variables.",
          ),
          ch(
            3,
            "Propagation of Error",
            "Measurement error and how uncertainty propagates through functions.",
          ),
          ch(
            4,
            "Commonly Used Distributions",
            "Bernoulli, binomial, Poisson, normal, exponential and other distributions and the central limit theorem.",
          ),
          ch(
            5,
            "Confidence Intervals",
            "Large and small sample intervals for means, proportions and differences, and bootstrapping.",
          ),
          ch(
            6,
            "Hypothesis Testing",
            "Tests for means and proportions, p-values, chi-square tests, power and multiple tests.",
          ),
          ch(
            7,
            "Correlation and Simple Linear Regression",
            "Correlation, least squares lines, inference on the slope and checking assumptions.",
          ),
          ch(
            8,
            "Multiple Regression",
            "Multiple linear regression, model selection and diagnostics.",
          ),
          ch(
            9,
            "Factorial Experiments",
            "One- and two-factor experiments, ANOVA and randomised block designs.",
          ),
          ch(
            10,
            "Statistical Quality Control",
            "Control charts for variables and attributes and process capability.",
          ),
        ],
      },
    ],
  },
  {
    title: "Advanced Programming in the UNIX Environment",
    authors: ["W. Richard Stevens", "Stephen A. Rago"],
    category: "operating-systems",
    rack: "CS-02",
    description:
      "The standard reference for systems programming on UNIX: files and directories, processes, signals, threads, daemons, interprocess communication and sockets, all through the system call interface.",
    tags: ["unix", "systems-programming"],
    editions: [
      {
        isbn13: "9780321638007",
        editionNo: 3,
        publisher: "Addison-Wesley",
        year: 2013,
        pages: 1032,
        totalChapters: 21,
        chapters: [
          ch(
            1,
            "UNIX System Overview",
            "Logging in, files and directories, input and output, programs and processes, and error handling.",
          ),
          ch(
            3,
            "File I/O",
            "Unbuffered I/O with open, read, write and lseek, file sharing and atomic operations.",
          ),
          ch(
            4,
            "Files and Directories",
            "File metadata, permissions, links and reading directories.",
          ),
          ch(
            5,
            "Standard I/O Library",
            "Streams, buffering and formatted and binary I/O in the C library.",
          ),
          ch(
            7,
            "Process Environment",
            "How a program starts and ends, memory layout, environment variables and resource limits.",
          ),
          ch(
            8,
            "Process Control",
            "fork, exec, wait, race conditions and changing user identities.",
          ),
          ch(10, "Signals", "Signal concepts, reliable signals, signal sets and handlers."),
          ch(
            11,
            "Threads",
            "Thread creation and termination, and synchronisation with mutexes, condition variables and barriers.",
          ),
          ch(
            12,
            "Thread Control",
            "Thread attributes, reentrancy, thread-specific data and threads with signals and fork.",
          ),
          ch(
            13,
            "Daemon Processes",
            "Writing background services, logging and single-instance daemons.",
          ),
          ch(
            15,
            "Interprocess Communication",
            "Pipes, FIFOs, message queues, semaphores and shared memory.",
          ),
          ch(
            16,
            "Network IPC: Sockets",
            "Socket addresses, connection setup and data transfer across a network.",
          ),
        ],
      },
    ],
  },
  {
    title: "Higher Engineering Mathematics",
    authors: ["B. S. Grewal"],
    category: "engineering-mathematics",
    rack: "MA-04",
    description:
      "The widely used Indian reference for engineering mathematics: calculus, differential equations, linear algebra, complex variables, transforms, numerical methods and probability, with many solved examples.",
    tags: ["engineering-mathematics"],
    editions: [
      {
        isbn13: "9788174091956",
        editionNo: 43,
        publisher: "Khanna Publishers",
        year: 2015,
        pages: 1238,
        totalChapters: 35,
        chapters: [],
      },
    ],
  },
  {
    title: "Advanced Engineering Mathematics",
    authors: ["R. K. Jain", "S. R. K. Iyengar"],
    category: "engineering-mathematics",
    rack: "MA-04",
    description:
      "Engineering mathematics from ordinary and partial differential equations to matrices, vector calculus, complex analysis, Fourier methods and numerical techniques.",
    tags: ["engineering-mathematics"],
    editions: [
      {
        isbn13: "9781842658468",
        editionNo: 4,
        publisher: "Alpha Science",
        year: 2013,
        pages: 1472,
        totalChapters: 12,
        chapters: [],
      },
    ],
  },
  {
    title: "Machine Learning",
    authors: ["Tom M. Mitchell"],
    category: "machine-learning",
    rack: "CS-06",
    description:
      "The classic introduction to learning algorithms and their theory: concept learning, decision trees, neural networks, Bayesian learning, instance-based methods, genetic algorithms and reinforcement learning.",
    tags: ["machine-learning"],
    editions: [
      {
        isbn13: "9780071154673",
        editionNo: 1,
        publisher: "McGraw-Hill Education",
        year: 1997,
        pages: 352,
        totalChapters: 13,
        chapters: [
          ch(
            1,
            "Introduction",
            "Well-posed learning problems, designing a learning system and open issues in machine learning.",
          ),
          ch(
            2,
            "Concept Learning and the General-to-Specific Ordering",
            "Hypothesis spaces, Find-S, version spaces and the candidate elimination algorithm.",
          ),
          ch(
            3,
            "Decision Tree Learning",
            "ID3, entropy and information gain, overfitting and pruning.",
          ),
          ch(
            4,
            "Artificial Neural Networks",
            "Perceptrons, gradient descent, multilayer networks and backpropagation.",
          ),
          ch(
            5,
            "Evaluating Hypotheses",
            "Estimating accuracy, confidence intervals and comparing learning algorithms.",
          ),
          ch(
            6,
            "Bayesian Learning",
            "Bayes theorem, maximum a posteriori hypotheses, naive Bayes, Bayesian networks and EM.",
          ),
          ch(
            7,
            "Computational Learning Theory",
            "PAC learning, sample complexity and the VC dimension.",
          ),
          ch(
            8,
            "Instance-Based Learning",
            "k-nearest neighbour, locally weighted regression and case-based reasoning.",
          ),
          ch(
            9,
            "Genetic Algorithms",
            "Representing hypotheses, genetic operators, fitness and genetic programming.",
          ),
          ch(
            10,
            "Learning Sets of Rules",
            "Sequential covering, learning first-order rules and FOIL.",
          ),
          ch(
            11,
            "Analytical Learning",
            "Learning with perfect domain theories and explanation-based learning.",
          ),
          ch(
            12,
            "Combining Inductive and Analytical Learning",
            "Using prior knowledge to initialise, search and alter the hypothesis.",
          ),
          ch(
            13,
            "Reinforcement Learning",
            "The learning task, Q learning, nondeterministic rewards and temporal difference learning.",
          ),
        ],
      },
    ],
  },
  {
    title: "Introduction to Machine Learning",
    authors: ["Ethem Alpaydin"],
    category: "machine-learning",
    rack: "CS-06",
    description:
      "A broad textbook on supervised and unsupervised learning: Bayesian decision theory, parametric and nonparametric methods, dimensionality reduction, clustering, trees, kernels, neural networks and experiment design.",
    tags: ["machine-learning"],
    editions: [
      {
        isbn13: "9780262358064",
        editionNo: 4,
        publisher: "MIT Press",
        year: 2020,
        pages: 712,
        totalChapters: 20,
        chapters: [
          ch(
            1,
            "Introduction",
            "What machine learning is, with examples of learning associations, classification and regression.",
          ),
          ch(
            2,
            "Supervised Learning",
            "Learning a class from examples, VC dimension, noise, model selection and generalisation.",
          ),
          ch(
            3,
            "Bayesian Decision Theory",
            "Classification under uncertainty, losses and risks, discriminant functions.",
          ),
          ch(
            4,
            "Parametric Methods",
            "Maximum likelihood estimation, bias and variance, and parametric classification and regression.",
          ),
          ch(
            5,
            "Multivariate Methods",
            "Multivariate normal distributions and multivariate classification and regression.",
          ),
          ch(
            6,
            "Dimensionality Reduction",
            "Feature selection, principal component analysis, factor analysis and linear discriminant analysis.",
          ),
          ch(
            7,
            "Clustering",
            "Mixture densities, k-means, expectation maximisation and hierarchical clustering.",
          ),
          ch(
            8,
            "Nonparametric Methods",
            "Histogram and kernel estimators, nearest neighbour classification and condensed methods.",
          ),
          ch(
            9,
            "Decision Trees",
            "Univariate classification and regression trees, pruning and rule extraction.",
          ),
          ch(
            10,
            "Linear Discrimination",
            "Linear models, logistic discrimination and gradient descent.",
          ),
          ch(
            11,
            "Multilayer Perceptrons",
            "The perceptron, backpropagation, training procedures and network size.",
          ),
          ch(
            12,
            "Deep Learning",
            "Deep networks, convolutional and recurrent layers and training tricks.",
          ),
          ch(
            14,
            "Kernel Machines",
            "Support vector machines, the kernel trick and kernel methods for regression.",
          ),
          ch(
            16,
            "Hidden Markov Models",
            "Discrete Markov processes, evaluation, decoding and learning model parameters.",
          ),
          ch(
            18,
            "Combining Multiple Learners",
            "Voting, bagging, boosting and stacking ensembles.",
          ),
          ch(
            19,
            "Reinforcement Learning",
            "Markov decision processes, dynamic programming and temporal difference learning.",
          ),
          ch(
            20,
            "Design and Analysis of Machine Learning Experiments",
            "Cross-validation, statistical tests and comparing classifiers.",
          ),
        ],
      },
    ],
  },
  {
    title: "Designing Machine Learning Systems",
    subtitle: "An Iterative Process for Production-Ready Applications",
    authors: ["Chip Huyen"],
    category: "machine-learning",
    rack: "CS-06",
    description:
      "How machine learning works in production: framing problems, data engineering, training data, features, evaluation, deployment, distribution shift, monitoring and MLOps infrastructure.",
    tags: ["machine-learning", "mlops"],
    editions: [
      {
        isbn13: "9781098107963",
        editionNo: 1,
        publisher: "O'Reilly Media",
        year: 2022,
        pages: 386,
        totalChapters: 11,
        chapters: [
          ch(
            1,
            "Overview of Machine Learning Systems",
            "When to use machine learning and how ML in production differs from research.",
          ),
          ch(
            2,
            "Introduction to Machine Learning Systems Design",
            "Business and ML objectives, requirements, iterative process and framing problems.",
          ),
          ch(
            3,
            "Data Engineering Fundamentals",
            "Data sources and formats, data models, storage engines, ETL and batch versus stream processing.",
          ),
          ch(4, "Training Data", "Sampling, labelling, class imbalance and data augmentation."),
          ch(
            5,
            "Feature Engineering",
            "Learned and engineered features, common operations, data leakage and feature importance.",
          ),
          ch(
            6,
            "Model Development and Offline Evaluation",
            "Model selection, ensembles, experiment tracking, distributed training and evaluation.",
          ),
          ch(
            7,
            "Model Deployment and Prediction Service",
            "Batch and online prediction, model compression and edge deployment.",
          ),
          ch(
            8,
            "Data Distribution Shifts and Monitoring",
            "Causes of failure, detecting and addressing shifts and observability.",
          ),
          ch(
            9,
            "Continual Learning and Test in Production",
            "Retraining strategies, shadow deployment, A/B tests and bandits.",
          ),
          ch(
            10,
            "Infrastructure and Tooling for MLOps",
            "Storage and compute, development environments, resource management and ML platforms.",
          ),
          ch(
            11,
            "The Human Side of Machine Learning",
            "User experience, team structure and responsible AI.",
          ),
        ],
      },
    ],
  },
  {
    title: "Machine Learning: The Art and Science of Algorithms that Make Sense of Data",
    authors: ["Peter Flach"],
    category: "machine-learning",
    rack: "CS-06",
    description:
      "A unified account of machine learning organised around tasks, models and features: binary classification, concept and tree learning, rules, linear and distance-based models, probabilistic models and ensembles.",
    tags: ["machine-learning"],
    editions: [
      {
        isbn13: "9781107422223",
        editionNo: 1,
        publisher: "Cambridge University Press",
        year: 2012,
        pages: 409,
        totalChapters: 12,
        chapters: [],
      },
    ],
  },
  {
    title: "Introduction to the Design and Analysis of Algorithms",
    authors: ["Anany Levitin"],
    category: "algorithms",
    rack: "CS-01",
    description:
      "Algorithms organised by design technique, from brute force and divide-and-conquer to dynamic programming, greedy methods and iterative improvement, with analysis of efficiency and the limits of computation.",
    tags: ["algorithms", "algorithm-design"],
    editions: [
      {
        isbn13: "9780132316811",
        editionNo: 3,
        publisher: "Pearson",
        year: 2012,
        pages: 565,
        totalChapters: 12,
        chapters: [
          ch(
            1,
            "Introduction",
            "What an algorithm is, problem solving steps and important problem types and data structures.",
          ),
          ch(
            2,
            "Fundamentals of the Analysis of Algorithm Efficiency",
            "Asymptotic notations, analysing recursive and non-recursive algorithms and empirical analysis.",
          ),
          ch(
            3,
            "Brute Force and Exhaustive Search",
            "Selection and bubble sort, sequential search, closest pair, convex hull and exhaustive search.",
          ),
          ch(
            4,
            "Decrease-and-Conquer",
            "Insertion sort, topological sorting, generating permutations and decrease-by-a-constant-factor algorithms.",
          ),
          ch(
            5,
            "Divide-and-Conquer",
            "Mergesort, quicksort, binary tree traversals, Strassen's multiplication and the master theorem.",
          ),
          ch(
            6,
            "Transform-and-Conquer",
            "Presorting, Gaussian elimination, balanced search trees, heaps and heapsort, Horner's rule.",
          ),
          ch(
            7,
            "Space and Time Trade-Offs",
            "Counting sort, input enhancement in string matching, hashing and B-trees.",
          ),
          ch(
            8,
            "Dynamic Programming",
            "Coin row and knapsack problems, optimal binary search trees, Warshall and Floyd algorithms.",
          ),
          ch(
            9,
            "Greedy Technique",
            "Prim's and Kruskal's spanning trees, Dijkstra's shortest paths and Huffman codes.",
          ),
          ch(
            10,
            "Iterative Improvement",
            "The simplex method, maximum flow, bipartite matching and stable marriage.",
          ),
          ch(
            11,
            "Limitations of Algorithm Power",
            "Lower bounds, decision trees and P, NP and NP-complete problems.",
          ),
          ch(
            12,
            "Coping with the Limitations of Algorithm Power",
            "Backtracking, branch and bound, approximation algorithms and numerical algorithms.",
          ),
        ],
      },
    ],
  },
  {
    title: "Computer & Internet Security",
    subtitle: "A Hands-on Approach",
    authors: ["Wenliang Du"],
    category: "security",
    rack: "CS-03",
    description:
      "Security learned by attacking and defending real systems: Set-UID programs, buffer overflows, race conditions, web attacks such as XSS and SQL injection, TCP and DNS attacks, firewalls, VPNs and cryptography in practice.",
    tags: ["security", "network-security", "web-security"],
    editions: [
      {
        isbn13: "9781733003902",
        editionNo: 2,
        publisher: "Lulu",
        year: 2019,
        pages: 440,
        totalChapters: 24,
        chapters: [],
      },
    ],
  },
  {
    title: "Responsible Artificial Intelligence",
    subtitle: "How to Develop and Use AI in a Responsible Way",
    authors: ["Virginia Dignum"],
    category: "artificial-intelligence",
    rack: "CS-06",
    description:
      "Why responsibility, accountability and transparency matter in AI systems, how values can be designed in, and how ethics and governance apply to autonomous and learning systems.",
    tags: ["ai-ethics"],
    editions: [
      {
        isbn13: "9783030303709",
        editionNo: 1,
        publisher: "Springer",
        year: 2019,
        pages: 127,
        totalChapters: 7,
        chapters: [],
      },
    ],
  },
  {
    title: "Data Privacy",
    subtitle: "Principles and Practice",
    authors: ["Nataraj Venkataramanan", "Ashwin Shriram"],
    category: "security",
    rack: "CS-03",
    description:
      "Protecting personal data in enterprise systems: anonymisation of structured and multidimensional data, privacy in test data, data mining and big data, and the regulations that apply.",
    tags: ["privacy"],
    editions: [
      {
        isbn13: "9781498721042",
        editionNo: 1,
        publisher: "CRC Press",
        year: 2016,
        pages: 456,
        totalChapters: 11,
        chapters: [],
      },
    ],
  },
  {
    title: "Web Development with Node and Express",
    subtitle: "Leveraging the JavaScript Stack",
    authors: ["Ethan Brown"],
    category: "software-engineering",
    rack: "CS-05",
    description:
      "Building web applications and REST APIs with Node.js and Express: templating, form handling, sessions, persistence, routing, security, testing and going to production.",
    tags: ["web-development", "javascript"],
    editions: [
      {
        isbn13: "9781492053514",
        editionNo: 2,
        publisher: "O'Reilly Media",
        year: 2019,
        pages: 346,
        totalChapters: 23,
        chapters: [],
      },
    ],
  },
  {
    title: "Full-Stack React Projects",
    authors: ["Shama Hoque"],
    category: "software-engineering",
    rack: "CS-05",
    description:
      "Project-based full-stack development with the MERN stack: a social media app, a classroom, a marketplace, media streaming and VR, combining React, Node, Express and MongoDB.",
    tags: ["web-development", "react"],
    editions: [
      {
        isbn13: "9781839215414",
        editionNo: 2,
        publisher: "Packt Publishing",
        year: 2020,
        pages: 716,
        totalChapters: 14,
        chapters: [],
      },
    ],
  },
  {
    title: "Data on the Web",
    subtitle: "From Relations to Semistructured Data and XML",
    authors: ["Serge Abiteboul", "Peter Buneman", "Dan Suciu"],
    category: "databases",
    rack: "CS-04",
    description:
      "How database ideas extend to data without a fixed schema: semistructured data models, query languages, XML, schema extraction and storing and querying such data.",
    tags: ["semistructured-data", "xml"],
    editions: [
      {
        isbn13: "9781558606227",
        editionNo: 1,
        publisher: "Morgan Kaufmann",
        year: 1999,
        pages: 257,
        totalChapters: 9,
        chapters: [],
      },
    ],
  },
  {
    title: "An Introduction to Database Systems",
    authors: ["C. J. Date"],
    category: "databases",
    rack: "CS-04",
    description:
      "Date's foundational treatment of the relational model: relational algebra and calculus, integrity, views, normalisation, recovery, concurrency, security and optimisation, with careful attention to theory.",
    tags: ["relational-model", "dbms"],
    editions: [
      {
        isbn13: "9780321197849",
        editionNo: 8,
        publisher: "Addison-Wesley",
        year: 2003,
        pages: 1024,
        totalChapters: 27,
        chapters: [],
      },
    ],
  },
  {
    title: "Software Engineering: A Practitioner's Approach",
    authors: ["Roger S. Pressman", "Bruce R. Maxim"],
    category: "software-engineering",
    rack: "CS-05",
    description:
      "The software process and its practice: agile and plan-driven models, requirements, design, quality assurance, testing, configuration management, project management and estimation.",
    tags: ["software-engineering"],
    editions: [
      {
        isbn13: "9789353165710",
        editionNo: 9,
        publisher: "McGraw-Hill Education",
        year: 2019,
        pages: 704,
        totalChapters: 30,
        chapters: [],
      },
    ],
  },
  {
    title: "Effective DevOps",
    subtitle: "Building a Culture of Collaboration, Affinity, and Tooling at Scale",
    authors: ["Jennifer Davis", "Ryn Daniels"],
    category: "software-engineering",
    rack: "CS-05",
    description:
      "DevOps as culture as much as tooling: collaboration between teams, affinity, tools for automation and deployment, and scaling those practices across an organisation.",
    tags: ["devops"],
    editions: [
      {
        isbn13: "9781491926307",
        editionNo: 1,
        publisher: "O'Reilly Media",
        year: 2016,
        pages: 410,
        totalChapters: 15,
        chapters: [],
      },
    ],
  },
  {
    title: "The Algorithm Design Manual",
    authors: ["Steven S. Skiena"],
    category: "algorithms",
    rack: "CS-01",
    description:
      "A practical guide to designing algorithms, with war stories from real problems and a catalogue of algorithmic problems and the best known ways to solve them.",
    tags: ["algorithms", "algorithm-design"],
    editions: [
      {
        isbn13: "9781848000698",
        editionNo: 2,
        publisher: "Springer",
        year: 2008,
        pages: 730,
        totalChapters: 19,
        chapters: [
          ch(
            1,
            "Introduction to Algorithm Design",
            "Robots, scheduling and correctness: modelling problems and proving algorithms right.",
          ),
          ch(
            2,
            "Algorithm Analysis",
            "The RAM model, big-oh notation, growth rates and summations.",
          ),
          ch(
            3,
            "Data Structures",
            "Contiguous and linked structures, dictionaries, binary search trees, priority queues and hashing.",
          ),
          ch(
            4,
            "Sorting and Searching",
            "Applications of sorting, heapsort, mergesort, quicksort, distribution sort and binary search.",
          ),
          ch(
            5,
            "Graph Traversal",
            "Graph representations, breadth-first and depth-first search and their applications.",
          ),
          ch(
            6,
            "Weighted Graph Algorithms",
            "Minimum spanning trees, shortest paths and network flows.",
          ),
          ch(
            7,
            "Combinatorial Search and Heuristic Methods",
            "Backtracking, pruning, simulated annealing and other heuristics.",
          ),
          ch(
            8,
            "Dynamic Programming",
            "Caching versus computation, approximate string matching and partition problems.",
          ),
          ch(
            9,
            "Intractable Problems and Approximation Algorithms",
            "Reductions, satisfiability, NP-completeness and approximation.",
          ),
          ch(
            10,
            "How to Design Algorithms",
            "A checklist of questions for attacking a new algorithmic problem.",
          ),
        ],
      },
    ],
  },
  {
    title: "Recommender Systems",
    subtitle: "The Textbook",
    authors: ["Charu C. Aggarwal"],
    category: "data-science",
    rack: "CS-06",
    description:
      "Recommendation methods in depth: neighbourhood-based and model-based collaborative filtering, content-based and knowledge-based systems, ensembles, evaluation, context and attacks on recommenders.",
    tags: ["recommender-systems"],
    editions: [
      {
        isbn13: "9783319296579",
        editionNo: 1,
        publisher: "Springer",
        year: 2016,
        pages: 498,
        totalChapters: 13,
        chapters: [],
      },
    ],
  },
  {
    title: "An Introduction to Statistical Learning",
    subtitle: "with Applications in R",
    authors: ["Gareth James", "Daniela Witten", "Trevor Hastie", "Robert Tibshirani"],
    category: "data-science",
    rack: "CS-06",
    description:
      "An accessible overview of statistical learning, from regression and classification to resampling, regularisation, trees, support vector machines, deep learning and unsupervised methods. The authors make it freely available.",
    tags: ["statistics", "machine-learning", "open-access"],
    editions: [
      {
        isbn13: "9781071614181",
        editionNo: 2,
        publisher: "Springer",
        year: 2021,
        pages: 607,
        totalChapters: 13,
        chapters: [
          ch(
            1,
            "Introduction",
            "What statistical learning is, with wage, stock market and gene expression examples.",
          ),
          ch(
            2,
            "Statistical Learning",
            "Estimating functions, prediction versus inference, the bias-variance trade-off and assessing accuracy.",
          ),
          ch(
            3,
            "Linear Regression",
            "Simple and multiple regression, qualitative predictors, interactions and potential problems.",
          ),
          ch(
            4,
            "Classification",
            "Logistic regression, linear and quadratic discriminant analysis, naive Bayes and k-nearest neighbours.",
          ),
          ch(
            5,
            "Resampling Methods",
            "Cross-validation and the bootstrap for estimating test error and uncertainty.",
          ),
          ch(
            6,
            "Linear Model Selection and Regularization",
            "Subset selection, ridge regression, the lasso and dimension reduction methods.",
          ),
          ch(
            7,
            "Moving Beyond Linearity",
            "Polynomial regression, step functions, splines, local regression and generalised additive models.",
          ),
          ch(
            8,
            "Tree-Based Methods",
            "Decision trees, bagging, random forests, boosting and Bayesian additive regression trees.",
          ),
          ch(
            9,
            "Support Vector Machines",
            "Maximal margin classifiers, support vector classifiers and kernels.",
          ),
          ch(
            10,
            "Deep Learning",
            "Neural networks, convolutional and recurrent networks and when to use deep learning.",
          ),
          ch(
            11,
            "Survival Analysis and Censored Data",
            "Survival curves, the log-rank test and the Cox proportional hazards model.",
          ),
          ch(
            12,
            "Unsupervised Learning",
            "Principal components analysis, matrix completion and clustering methods.",
          ),
          ch(
            13,
            "Multiple Testing",
            "Family-wise error rate, false discovery rate and resampling approaches.",
          ),
        ],
      },
    ],
  },
];
