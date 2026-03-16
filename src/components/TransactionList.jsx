import { ListGroup, Badge } from 'react-bootstrap';

export default function TransactionList({ transactions = [] }) {
  if (transactions.length === 0) {
    return (
      <div className="p-5 text-center text-muted">
        <p className="mb-0">No transactions found.</p>
      </div>
    );
  }

  return (
    <ListGroup variant="flush">
      {transactions.map((tx) => (
        <ListGroup.Item key={tx._id} className="d-flex justify-content-between align-items-center py-3 px-4 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <div 
              className={`rounded-circle d-flex align-items-center justify-content-center text-white`}
              style={{ 
                width: '40px', height: '40px', 
                backgroundColor: tx.type === 'deposit' ? '#198754' : '#dc3545' 
              }}
            >
              <span className="fw-bold fs-5">
                {tx.type === 'deposit' ? '↓' : '↑'}
              </span>
            </div>
            <div>
              <p className="mb-0 fw-bold text-capitalize">{tx.type} <span className="text-muted fw-normal small">({tx.status})</span></p>
              <p className="mb-0 text-muted small">
                {new Date(tx.timestamp).toLocaleString('en-IN', {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          
          <div className={`fs-5 fw-bold font-monospace ${
              tx.type === 'deposit' ? 'text-success' : 'text-danger'
            }`}>
            {tx.type === 'deposit' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
}
