# LibraSearch - Relational Schema & Normalization Analysis

**Course:** Database Management System (UE24CS351A)  

## Team Details
- **Member 1:** Shakthi Raja G P (SRN: `PES1UG25CS843`)
- **Member 2:** Kishan S (SRN: `PES2UG23CS277`)

---

## 1. Visual Schema Assets

The visual relational schema matching academic textbook conventions is provided in:
- **Draw.io Relational Schema Diagram:** [`relational-schema.drawio`](./drawio/relational-schema.drawio)
- **Draw.io Physical Table Cards:** [`relational-tables.drawio`](./drawio/relational-tables.drawio)
- **Consolidated Master File:** [`librasearch-database-design.drawio`](./drawio/librasearch-database-design.drawio)

---

## 2. Formal Relational Schema Definitions

Primary keys are underlined (`<u>attribute</u>`). Foreign keys are marked with `(FK)` and explicit target citations.

1. **`ROLES`** (  
   &nbsp;&nbsp;<u>`role_id`</u>, `role_name`, `description`  
   )

2. **`USERS`** (  
   &nbsp;&nbsp;<u>`user_id`</u>, `name`, `email`, `password_hash`, `role_id` *(FK -> ROLES.role_id)*, `is_active`, `created_at`  
   )

3. **`BOOKS`** (  
   &nbsp;&nbsp;<u>`book_id`</u>, `title`, `author`, `genre`, `isbn`, `description`, `published_year`, `total_copies`, `available_copies`  
   )

4. **`BOOK_COPIES`** (  
   &nbsp;&nbsp;<u>`copy_id`</u>, `book_id` *(FK -> BOOKS.book_id)*, `barcode`, `condition_state`, `status`, `acquired_date`  
   )

5. **`LOANS`** (  
   &nbsp;&nbsp;<u>`loan_id`</u>, `copy_id` *(FK -> BOOK_COPIES.copy_id)*, `user_id` *(FK -> USERS.user_id)*, `borrow_date`, `due_date`, `return_date`, `status`, `created_at`  
   )

6. **`RESERVATIONS`** (  
   &nbsp;&nbsp;<u>`reservation_id`</u>, `book_id` *(FK -> BOOKS.book_id)*, `user_id` *(FK -> USERS.user_id)*, `reservation_date`, `queue_position`, `status`, `notified_at`  
   )

7. **`FINES`** (  
   &nbsp;&nbsp;<u>`fine_id`</u>, `loan_id` *(FK -> LOANS.loan_id)*, `amount`, `days_overdue`, `payment_status`, `created_at`  
   )

8. **`REVIEWS`** (  
   &nbsp;&nbsp;<u>`review_id`</u>, `book_id` *(FK -> BOOKS.book_id)*, `user_id` *(FK -> USERS.user_id)*, `rating`, `review_text`, `created_at`  
   )

9. **`SEARCH_LOGS`** (  
   &nbsp;&nbsp;<u>`log_id`</u>, `user_id` *(FK -> USERS.user_id, Nullable)*, `query_text`, `top_similarity_score`, `results_count`, `is_gap`, `searched_at`  
   )

---

## 3. Functional Dependencies & Candidate Keys

| Relation | Functional Dependencies (FDs) | Candidate Keys | Prime Attributes | Non-Prime Attributes |
| :--- | :--- | :--- | :--- | :--- |
| **`ROLES`** | FD1: `role_id -> role_name, description`<br/>FD2: `role_name -> role_id, description` | `role_id`, `role_name` | `role_id`, `role_name` | `description` |
| **`USERS`** | FD1: `user_id -> name, email, password_hash, role_id, is_active, created_at`<br/>FD2: `email -> user_id, name, password_hash, role_id, is_active, created_at` | `user_id`, `email` | `user_id`, `email` | `name`, `password_hash`, `role_id`, `is_active`, `created_at` |
| **`BOOKS`** | FD1: `book_id -> title, author, genre, isbn, description, published_year, total_copies, available_copies`<br/>FD2: `isbn -> book_id, title, author, genre, description, published_year, total_copies, available_copies` | `book_id`, `isbn` | `book_id`, `isbn` | `title`, `author`, `genre`, `description`, `published_year`, `total_copies`, `available_copies` |
| **`BOOK_COPIES`** | FD1: `copy_id -> book_id, barcode, condition_state, status, acquired_date`<br/>FD2: `barcode -> copy_id, book_id, condition_state, status, acquired_date` | `copy_id`, `barcode` | `copy_id`, `barcode` | `book_id`, `condition_state`, `status`, `acquired_date` |
| **`LOANS`** | FD1: `loan_id -> copy_id, user_id, borrow_date, due_date, return_date, status, created_at` | `loan_id` | `loan_id` | `copy_id`, `user_id`, `borrow_date`, `due_date`, `return_date`, `status`, `created_at` |
| **`RESERVATIONS`** | FD1: `reservation_id -> book_id, user_id, reservation_date, queue_position, status, notified_at` | `reservation_id` | `reservation_id` | `book_id`, `user_id`, `reservation_date`, `queue_position`, `status`, `notified_at` |
| **`FINES`** | FD1: `fine_id -> loan_id, amount, days_overdue, payment_status, created_at`<br/>FD2: `loan_id -> fine_id, amount, days_overdue, payment_status, created_at` | `fine_id`, `loan_id` | `fine_id`, `loan_id` | `amount`, `days_overdue`, `payment_status`, `created_at` |
| **`REVIEWS`** | FD1: `review_id -> book_id, user_id, rating, review_text, created_at`<br/>FD2: `(book_id, user_id) -> review_id, rating, review_text, created_at` | `review_id`, `(book_id, user_id)` | `review_id`, `book_id`, `user_id` | `rating`, `review_text`, `created_at` |
| **`SEARCH_LOGS`**| FD1: `log_id -> user_id, query_text, top_similarity_score, results_count, is_gap, searched_at` | `log_id` | `log_id` | `user_id`, `query_text`, `top_similarity_score`, `results_count`, `is_gap`, `searched_at` |

---

## 4. Normalization Proofs (Up to BCNF)

### 4.1 First Normal Form (1NF) Compliance
A relation is in 1NF if and only if all underlying attribute domains contain only atomic (indivisible) values, with no repeating groups or nested relations.
- **Verification:**
  1. Every cell contains a single scalar value (integers, fixed-precision decimals, ISO date-times, strings).
  2. Multi-copy inventory is decoupled from bibliographic titles: individual copies are modeled in `BOOK_COPIES`, eliminating comma-separated barcodes or nested array records in `BOOKS`.
  3. Fines, reviews, and loans are distinct relations, eliminating repeating transaction groups within `USERS`.
  4. Conclusion: The schema strictly satisfies 1NF.

### 4.2 Second Normal Form (2NF) Compliance
A relation is in 2NF if it is in 1NF and no non-prime attribute is partially dependent on any candidate key of the relation.
- **Verification:**
  1. Relations `ROLES`, `USERS`, `BOOKS`, `BOOK_COPIES`, `LOANS`, `RESERVATIONS`, `FINES`, and `SEARCH_LOGS` possess candidate keys comprising single attributes (`role_id`, `user_id`, `book_id`, `copy_id`, `loan_id`, `reservation_id`, `fine_id`, `log_id`). A partial key dependency is mathematically impossible when keys are single attributes.
  2. For `REVIEWS`, the candidate keys are `review_id` (single attribute) and composite candidate key `(book_id, user_id)`. Non-prime attributes (`rating`, `review_text`, `created_at`) depend on both the specific book and the specific user simultaneously (the review applies specifically to that book written by that borrower). Neither `rating` nor `review_text` depends solely on `book_id` or solely on `user_id`.
  3. Conclusion: No partial dependencies exist; the schema strictly satisfies 2NF.

### 4.3 Third Normal Form (3NF) Compliance
A relation is in 3NF if it is in 2NF and no non-prime attribute is transitively dependent on a candidate key (for every non-trivial FD $X \rightarrow Y$, either $X$ is a superkey or $Y$ is a prime attribute).
- **Verification:**
  1. In `USERS`, `user_id -> role_id`, but `role_name` and `description` are not stored in `USERS`. They are decoupled into `ROLES`, eliminating the transitive dependency `user_id -> role_id -> role_name`.
  2. In `LOANS`, `loan_id -> copy_id`, but title information is not duplicated into `LOANS`. Catalog queries join through `BOOK_COPIES -> BOOKS`.
  3. In `FINES`, `fine_id -> loan_id`, but loan dates and patron details reside strictly in `LOANS` and `USERS`, preventing transitive chains.
  4. In `BOOK_COPIES`, `copy_id -> book_id`, but title, author, and ISBN remain exclusively in `BOOKS`.
  5. Conclusion: Zero transitive dependencies exist across non-prime attributes; the schema strictly satisfies 3NF.

### 4.4 Boyce-Codd Normal Form (BCNF) Compliance
A relation is in BCNF if for every non-trivial functional dependency $X \rightarrow Y$, $X$ is a superkey of the relation.
- **Verification:**
  - `ROLES`: For $FD_1$, determinant `role_id` is a candidate key. For $FD_2$, determinant `role_name` is a candidate key.
  - `USERS`: For $FD_1$, determinant `user_id` is a candidate key. For $FD_2$, determinant `email` is a candidate key.
  - `BOOKS`: For $FD_1$, determinant `book_id` is a candidate key. For $FD_2$, determinant `isbn` is a candidate key.
  - `BOOK_COPIES`: For $FD_1$, determinant `copy_id` is a candidate key. For $FD_2$, determinant `barcode` is a candidate key.
  - `LOANS`: Determinant `loan_id` is a candidate key.
  - `RESERVATIONS`: Determinant `reservation_id` is a candidate key.
  - `FINES`: Both determinants `fine_id` and `loan_id` are candidate keys (1:1 loan liability constraint).
  - `REVIEWS`: Determinant `review_id` is a candidate key; composite determinant `(book_id, user_id)` is a candidate key.
  - `SEARCH_LOGS`: Determinant `log_id` is a candidate key.
  - Conclusion: In every relation, all left-hand determinants of non-trivial functional dependencies are superkeys. The schema is formally normalized up to Boyce-Codd Normal Form (BCNF).

---

## 5. Referential Integrity & Foreign Key Actions

| Foreign Key | Child Table | Parent Table | On Delete Action | On Update Action | Integrity Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `role_id` | `USERS` | `ROLES(role_id)` | `RESTRICT` | `CASCADE` | Prevents deleting system roles while users are assigned to them. |
| `book_id` | `BOOK_COPIES` | `BOOKS(book_id)` | `RESTRICT` | `CASCADE` | Prevents removing catalog records that hold active physical inventory. |
| `copy_id` | `LOANS` | `BOOK_COPIES(copy_id)`| `RESTRICT` | `CASCADE` | Preserves complete circulation history for physical assets. |
| `user_id` | `LOANS` | `USERS(user_id)` | `RESTRICT` | `CASCADE` | Guarantees audit trail for borrowed items and financial liabilities. |
| `book_id` | `RESERVATIONS` | `BOOKS(book_id)` | `CASCADE` | `CASCADE` | Hold requests are deleted if a catalog title is formally decommissioned. |
| `user_id` | `RESERVATIONS` | `USERS(user_id)` | `CASCADE` | `CASCADE` | Clears pending waitlist holds if a patron account is closed. |
| `loan_id` | `FINES` | `LOANS(loan_id)` | `RESTRICT` | `CASCADE` | Protects financial audit records from deletion if circulation records exist. |
| `book_id` | `REVIEWS` | `BOOKS(book_id)` | `CASCADE` | `CASCADE` | Removes reader reviews if title is pruned from catalog. |
| `user_id` | `REVIEWS` | `USERS(user_id)` | `CASCADE` | `CASCADE` | Retains referential consistency with user accounts. |
| `user_id` | `SEARCH_LOGS` | `USERS(user_id)` | `SET NULL` | `CASCADE` | Preserves anonymous search demand history if a patron account is purged. |

