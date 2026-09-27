/**
 * Courses outside computing offered this term, with syllabus units written the
 * way a university syllabus phrases them. Computing and mathematics courses
 * come from the published 2026 syllabus in syllabus-courses.ts.
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
