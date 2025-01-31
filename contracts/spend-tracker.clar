;; Government Spending Tracker Contract

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-invalid-amount (err u101)) 
(define-constant err-invalid-department (err u102))
(define-constant err-invalid-category (err u103))
(define-constant page-size u50)

;; Data Variables
(define-data-var total-budget uint u0)
(define-data-var fiscal-year uint u2024)

;; Data Maps
(define-map department-budgets principal uint)
(define-map department-spending principal uint)
(define-map category-spending
    (string-ascii 64)
    uint
)
(define-map spending-records
    uint
    {
        department: principal,
        amount: uint,
        category: (string-ascii 64),
        description: (string-ascii 256),
        timestamp: uint
    }
)
(define-data-var spending-nonce uint u0)

;; Public Functions
(define-public (allocate-budget (department principal) (amount uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (> amount u0) err-invalid-amount)
        (map-set department-budgets department amount)
        (var-set total-budget (+ amount (var-get total-budget)))
        (ok true)
    )
)

(define-public (record-spending 
    (department principal) 
    (amount uint) 
    (category (string-ascii 64))
    (description (string-ascii 256))
)
    (let (
        (current-budget (default-to u0 (map-get? department-budgets department)))
        (current-spending (default-to u0 (map-get? department-spending department)))
        (category-total (default-to u0 (map-get? category-spending category)))
        (nonce (var-get spending-nonce))
    )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (> amount u0) err-invalid-amount)
        (asserts! (>= current-budget (+ current-spending amount)) err-invalid-amount)
        
        (map-set spending-records nonce {
            department: department,
            amount: amount,
            category: category,
            description: description,
            timestamp: block-height
        })
        
        (map-set department-spending department (+ current-spending amount))
        (map-set category-spending category (+ category-total amount))
        (var-set spending-nonce (+ nonce u1))
        (ok true)
    )
)

;; Read Only Functions
(define-read-only (get-department-budget (department principal))
    (ok (default-to u0 (map-get? department-budgets department)))
)

(define-read-only (get-department-spending (department principal))
    (ok (default-to u0 (map-get? department-spending department)))
)

(define-read-only (get-category-spending (category (string-ascii 64)))
    (ok (default-to u0 (map-get? category-spending category)))
)

(define-read-only (get-spending-record (id uint))
    (ok (map-get? spending-records id))
)

(define-read-only (get-spending-page (page uint))
    (let (
        (start (* page page-size))
        (end (+ start page-size))
        (total (var-get spending-nonce))
    )
        (ok {
            records: (map get-spending-record 
                (unwrap-panic (slice? start (min end total) (enumerate total)))),
            total: total
        })
    )
)

(define-read-only (get-spending-by-date-range (start-block uint) (end-block uint))
    (let ((records (list)))
        (ok records) ;; TODO: Implement date range filtering
    )
)

(define-read-only (get-total-budget))
    (ok (var-get total-budget))
)

(define-read-only (get-fiscal-year)
    (ok (var-get fiscal-year))
)

(define-read-only (get-spending-count)
    (ok (var-get spending-nonce))
)
