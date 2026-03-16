import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import api from '../api';
import ActionModal from '../components/ActionModal';
import TransactionList from '../components/TransactionList';

export default function Dashboard() {
  const { user, logout, setUser } = useAuth();
  const [balance, setBalance] = useState(user?.balance || 0);
  const [transactions, setTransactions] = useState([]);
  const [modalType, setModalType] = useState(null); // 'deposit' or 'withdraw'

  const fetchData = async () => {
    try {
      const [balRes, txRes] = await Promise.all([
        api.get('/tx/balance'),
        api.get('/tx/history')
      ]);
      setBalance(balRes.data.balance);
      setTransactions(txRes.data);
      setUser(prev => ({ ...prev, ...balRes.data }));
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0">Welcome, {user?.name}</h2>
          <p className="text-muted">A/C: •••• {user?.accountNumber?.slice(-4) || 'XXXX'}</p>
        </div>
        <Button variant="outline-danger" onClick={logout} className="custom-btn">
          Sign Out
        </Button>
      </div>

      <Row className="mb-4">
        <Col md={8} className="mb-3 mb-md-0">
          <Card className="custom-card h-100 text-center p-4 bg-primary text-white">
            <Card.Body>
              <p className="mb-2 opacity-75">Available Balance</p>
              <h1 className="display-4 fw-bold mb-4">
                ₹{balance?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h1>
              <div className="d-flex justify-content-center gap-3">
                <Button variant="light" className="custom-btn px-4" onClick={() => setModalType('deposit')}>
                  Deposit
                </Button>
                <Button variant="outline-light" className="custom-btn px-4" onClick={() => setModalType('withdraw')}>
                  Withdraw
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="custom-card h-100 p-4 text-center d-flex justify-content-center align-items-center">
            <h5>Secure PIN Required</h5>
            <p className="text-muted small mb-0">
              All transactions are secured with your secret PIN code to ensure maximum safety.
            </p>
          </Card>
        </Col>
      </Row>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Recent Transactions</h4>
        <Button variant="link" onClick={fetchData} className="text-decoration-none p-0">
          Refresh
        </Button>
      </div>
      
      <Card className="custom-card border-0 mb-4">
        <TransactionList transactions={transactions} />
      </Card>

      <ActionModal 
        show={!!modalType}
        type={modalType} 
        onHide={() => setModalType(null)} 
        onSuccess={fetchData} 
      />
    </Container>
  );
}
