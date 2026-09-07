/**
 * Courses offered this term and their syllabus units, written the way a
 * university syllabus phrases them. Units use course language on purpose: it
 * rarely matches a textbook's chapter titles, which is the gap semantic
 * mapping closes.
 */

export type UnitSeed = { title: string; topics: string; hours: number };

export type CourseSeed = {
  code: string;
  title: string;
  dept: string;
  semester: number;
  credits: number;
  description: string;
  units: UnitSeed[];
  /** End-semester exam starts this many days after the seed runs. */
  endSemInDays: number;
};

export const COURSES: CourseSeed[] = [
  {
    code: "UE24CS351A",
    title: "Database Management Systems",
    dept: "CSE",
    semester: 5,
    credits: 4,
    endSemInDays: 7,
    description:
      "Design and implementation of relational databases, SQL, normalisation, storage, indexing and transactions.",
    units: [
      {
        title: "Introduction and the relational model",
        topics:
          "Database applications, data models, schemas and instances, three-schema architecture, relational model, keys, relational algebra",
        hours: 10,
      },
      {
        title: "SQL and advanced queries",
        topics:
          "DDL and DML, joins, nested and correlated subqueries, aggregation with group by and having, views, triggers, stored procedures and functions",
        hours: 12,
      },
      {
        title: "Functional dependencies and normal forms",
        topics:
          "ER modelling and mapping to relations, functional dependencies, attribute closure, 1NF, 2NF, 3NF, BCNF, lossless decomposition, dependency preservation",
        hours: 10,
      },
      {
        title: "Storage, indexing and query processing",
        topics:
          "File organisation, primary and secondary indexes, B+ trees, hashing, query evaluation, join algorithms, cost-based optimisation",
        hours: 10,
      },
      {
        title: "Transactions, concurrency and recovery",
        topics:
          "ACID properties, schedules, conflict serializability, two-phase locking, deadlock handling, timestamp ordering, log-based recovery",
        hours: 10,
      },
    ],
  },
  {
    code: "UE24CS251A",
    title: "Design and Analysis of Algorithms",
    dept: "CSE",
    semester: 4,
    credits: 4,
    endSemInDays: 30,
    description:
      "Techniques for designing efficient algorithms and proving their correctness and complexity.",
    units: [
      {
        title: "Analysis framework and divide and conquer",
        topics:
          "Asymptotic notation, recurrences, master theorem, merge sort, quicksort, binary search",
        hours: 10,
      },
      {
        title: "Heaps, hashing and search trees",
        topics:
          "Priority queues and heapsort, hash tables and collision resolution, binary search trees, balanced trees",
        hours: 10,
      },
      {
        title: "Dynamic programming",
        topics:
          "Optimal substructure, memoisation, knapsack, longest common subsequence, matrix chain multiplication",
        hours: 10,
      },
      {
        title: "Greedy techniques and graph algorithms",
        topics:
          "Activity selection, Huffman coding, BFS and DFS, topological sort, Dijkstra, minimum spanning trees",
        hours: 12,
      },
      {
        title: "Limitations of algorithm power",
        topics:
          "Lower bounds, P and NP, NP-complete problems, polynomial reductions, coping with intractability",
        hours: 8,
      },
    ],
  },
  {
    code: "UE24CS252A",
    title: "Operating Systems",
    dept: "CSE",
    semester: 4,
    credits: 4,
    endSemInDays: 32,
    description: "How an operating system manages processes, memory, storage and concurrency.",
    units: [
      {
        title: "Processes and CPU scheduling",
        topics:
          "Process states, context switching, scheduling criteria, FCFS, SJF, priority, round robin, multilevel queues",
        hours: 10,
      },
      {
        title: "Threads and synchronisation",
        topics:
          "Multithreading models, critical section problem, mutex locks, semaphores, monitors, classical synchronisation problems",
        hours: 12,
      },
      {
        title: "Deadlocks",
        topics:
          "Necessary conditions, resource allocation graphs, banker's algorithm, detection and recovery",
        hours: 6,
      },
      {
        title: "Memory management and virtual memory",
        topics:
          "Paging, segmentation, page tables, TLB, demand paging, page replacement, thrashing",
        hours: 12,
      },
      {
        title: "File systems and storage",
        topics: "File concepts, directory structure, allocation methods, free space management",
        hours: 8,
      },
    ],
  },
  {
    code: "UE24CS352A",
    title: "Computer Networks",
    dept: "CSE",
    semester: 5,
    credits: 4,
    endSemInDays: 9,
    description:
      "Layered network architecture and the protocols that move data across the Internet.",
    units: [
      {
        title: "Network architecture and application protocols",
        topics:
          "Layering, packet switching, delay and throughput, HTTP, DNS, email, socket programming",
        hours: 10,
      },
      {
        title: "Transport layer",
        topics: "UDP, reliable data transfer, TCP segments, flow control, congestion control",
        hours: 12,
      },
      {
        title: "Network layer and routing",
        topics:
          "IPv4 and IPv6 addressing, subnetting, forwarding, link-state and distance-vector routing, OSPF, BGP",
        hours: 12,
      },
      {
        title: "Link layer and local networks",
        topics: "Error detection, multiple access, ARP, Ethernet, switches, VLANs",
        hours: 8,
      },
      {
        title: "Network security",
        topics: "Symmetric and public key cryptography, digital signatures, TLS, firewalls",
        hours: 6,
      },
    ],
  },
  {
    code: "UE24CS353A",
    title: "Machine Intelligence",
    dept: "CSE",
    semester: 5,
    credits: 4,
    endSemInDays: 34,
    description: "Search, reasoning under uncertainty and learning from data.",
    units: [
      {
        title: "Intelligent agents and search",
        topics: "Agent types, problem formulation, uninformed search, A* and heuristics",
        hours: 10,
      },
      {
        title: "Constraint satisfaction and logic",
        topics: "CSP formulation, backtracking, arc consistency, propositional logic, inference",
        hours: 8,
      },
      {
        title: "Probabilistic reasoning",
        topics: "Probability axioms, Bayes rule, conditional independence, naive Bayes",
        hours: 8,
      },
      {
        title: "Supervised learning",
        topics:
          "Decision trees, linear and logistic regression, overfitting, regularisation, model evaluation",
        hours: 12,
      },
      {
        title: "Neural networks",
        topics: "Perceptron, multilayer networks, backpropagation, convolutional networks",
        hours: 10,
      },
    ],
  },
  {
    code: "UE24CS354A",
    title: "Compiler Design",
    dept: "CSE",
    semester: 5,
    credits: 4,
    endSemInDays: 36,
    description: "The phases of a compiler from scanning to optimisation and code generation.",
    units: [
      {
        title: "Lexical analysis",
        topics: "Tokens, regular expressions, finite automata, lexer generators",
        hours: 8,
      },
      {
        title: "Parsing",
        topics: "Context-free grammars, top-down and LL(1) parsing, bottom-up and LR parsing",
        hours: 14,
      },
      {
        title: "Semantic analysis and intermediate code",
        topics: "Syntax-directed definitions, type checking, three-address code",
        hours: 10,
      },
      {
        title: "Optimisation and code generation",
        topics: "Basic blocks, data-flow analysis, register allocation, instruction selection",
        hours: 10,
      },
    ],
  },
  {
    code: "UE24MA241A",
    title: "Discrete Mathematics",
    dept: "MATH",
    semester: 3,
    credits: 4,
    endSemInDays: 28,
    description: "Mathematical reasoning and discrete structures for computing.",
    units: [
      {
        title: "Logic and proof techniques",
        topics:
          "Propositional and predicate logic, quantifiers, rules of inference, direct and indirect proof",
        hours: 10,
      },
      {
        title: "Sets, relations and functions",
        topics: "Set operations, equivalence relations, partial orders, closures, functions",
        hours: 10,
      },
      {
        title: "Induction and combinatorics",
        topics:
          "Mathematical induction, recursion, permutations, combinations, pigeonhole principle",
        hours: 10,
      },
      {
        title: "Graphs and trees",
        topics:
          "Graph representations, connectivity, Euler and Hamilton paths, trees, spanning trees",
        hours: 10,
      },
    ],
  },
  {
    code: "UE24MA211A",
    title: "Linear Algebra and Its Applications",
    dept: "MATH",
    semester: 2,
    credits: 4,
    endSemInDays: 40,
    description:
      "Matrices, vector spaces and decompositions used across engineering and data science.",
    units: [
      {
        title: "Systems of linear equations",
        topics: "Gaussian elimination, matrix inverse, LU decomposition",
        hours: 10,
      },
      {
        title: "Vector spaces",
        topics: "Subspaces, null space, column space, rank, basis and dimension",
        hours: 10,
      },
      {
        title: "Orthogonality and least squares",
        topics: "Projections, Gram-Schmidt, least squares fitting",
        hours: 10,
      },
      {
        title: "Eigenvalues and SVD",
        topics:
          "Diagonalisation, symmetric matrices, singular value decomposition, principal components",
        hours: 12,
      },
    ],
  },
  {
    code: "UE24EC201A",
    title: "Digital Design and Computer Organisation",
    dept: "ECE",
    semester: 3,
    credits: 4,
    endSemInDays: 26,
    description:
      "Logic design from Boolean algebra to sequential circuits and processor organisation.",
    units: [
      {
        title: "Number systems and Boolean algebra",
        topics: "Binary codes, complements, Boolean theorems, logic gates",
        hours: 8,
      },
      {
        title: "Logic minimisation",
        topics: "Karnaugh maps, don't cares, NAND and NOR implementation",
        hours: 8,
      },
      {
        title: "Combinational circuits",
        topics: "Adders, multiplexers, decoders, comparators",
        hours: 10,
      },
      {
        title: "Sequential circuits",
        topics: "Latches, flip-flops, counters, registers, state machines",
        hours: 12,
      },
    ],
  },
  {
    code: "UE24EC251A",
    title: "Signals and Systems",
    dept: "ECE",
    semester: 4,
    credits: 4,
    endSemInDays: 38,
    description: "Representation and analysis of continuous and discrete-time signals and systems.",
    units: [
      {
        title: "LTI systems and convolution",
        topics: "Signal classification, system properties, convolution sum and integral",
        hours: 10,
      },
      {
        title: "Fourier analysis",
        topics: "Fourier series, Fourier transform and its properties, frequency response",
        hours: 12,
      },
      { title: "Sampling", topics: "Sampling theorem, aliasing, reconstruction", hours: 6 },
      {
        title: "Laplace and Z transforms",
        topics: "Region of convergence, inverse transforms, transfer functions, stability",
        hours: 12,
      },
    ],
  },
  {
    code: "UE24EE201A",
    title: "Electric Circuit Analysis",
    dept: "EEE",
    semester: 3,
    credits: 4,
    endSemInDays: 27,
    description: "Analysis of DC and AC circuits with network theorems.",
    units: [
      {
        title: "Circuit laws",
        topics: "Ohm's law, Kirchhoff's laws, series and parallel networks, star-delta conversion",
        hours: 10,
      },
      {
        title: "Analysis techniques",
        topics: "Nodal and mesh analysis with dependent sources",
        hours: 10,
      },
      {
        title: "Network theorems",
        topics: "Superposition, Thevenin, Norton, maximum power transfer",
        hours: 10,
      },
    ],
  },
  {
    code: "UE24ME251A",
    title: "Engineering Thermodynamics",
    dept: "ME",
    semester: 4,
    credits: 4,
    endSemInDays: 33,
    description: "Energy, entropy and the cycles that power engines and refrigerators.",
    units: [
      {
        title: "First law of thermodynamics",
        topics: "Systems, work and heat, energy balance for closed and open systems",
        hours: 12,
      },
      {
        title: "Second law and entropy",
        topics: "Heat engines, Carnot cycle, Clausius inequality, entropy generation",
        hours: 12,
      },
      {
        title: "Heat transfer basics",
        topics: "Conduction, convection, radiation, thermal resistance, fins",
        hours: 10,
      },
    ],
  },
];
