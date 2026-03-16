import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Container, Row, Col, Card, Button, Form, Alert, Modal, Spinner } from 'react-bootstrap';
import api from '../api';
import { io } from 'socket.io-client';

export default function AdminDashboard() {
  const { logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Create User State
  const [formData, setFormData] = useState({ name: '', email: '', password: '', pin: '', accountNumber: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Add/Manage Cash State
  const [showCashModal, setShowCashModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [cashAmount, setCashAmount] = useState('');
  const [cashType, setCashType] = useState('deposit'); // 'deposit' or 'withdraw'
  const [cashLoading, setCashLoading] = useState(false);

  // History State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [userHistory, setUserHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Edit User State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ name: '', email: '', accountNumber: '', pin: '' });

  useEffect(() => {
    fetchData();

    const socket = io('http://localhost:5000');
    socket.on('new_transaction', (tx) => {
      setTransactions((prev) => [tx, ...prev]);
    });

    return () => socket.disconnect();
  }, []);

  const fetchData = async () => {
    try {
      const [uRes, tRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/transactions')
      ]);
      setUsers(uRes.data);
      setTransactions(tRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/admin/users', formData);
      setShowCreateModal(false);
      fetchData();
      setFormData({ name: '', email: '', password: '', pin: '', accountNumber: '' });
    } catch (err) {
      setError(err.response?.data?.msg || 'Error creating user');
    }
    setLoading(false);
  };

  const handleManageCash = async (e) => {
    e.preventDefault();
    setCashLoading(true);
    try {
      await api.post(`/admin/users/${selectedUser._id}/manage-cash`, { 
        amount: Number(cashAmount),
        type: cashType 
      });
      setShowCashModal(false);
      setCashAmount('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.msg || 'Error managing cash');
    }
    setCashLoading(false);
  };

  const fetchUserHistory = async (user) => {
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const userTxs = transactions.filter(tx => {
        const txUserId = (typeof tx.userId === 'object' ? tx.userId?._id : tx.userId);
        return String(txUserId) === String(user._id);
      });
      setUserHistory(userTxs);
    } catch (err) {
      console.error(err);
    }
    setHistoryLoading(false);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/admin/users/${selectedUser._id}`, editData);
      setShowEditModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.msg || 'Error updating user');
    }
    setLoading(false);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this account? This will also remove all transaction history.')) {
      try {
        await api.delete(`/admin/users/${userId}`);
        fetchData();
      } catch (err) {
        alert(err.response?.data?.msg || 'Error deleting user');
      }
    }
  };

  const [activeTab, setActiveTab] = useState('dashboard');
  
  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard':
        return (
          <Row>
            <Col md={12}>
              <Card className="custom-card mb-4 border-0 shadow-sm" style={{ backgroundColor: '#fff' }}>
                <Card.Header className="bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fw-bold text-dark d-flex align-items-center">
                    
                    Live Transaction Feed
                  </h5>
                  <span className="badge bg-success py-2 px-3 rounded-pill">Secured Node</span>
                </Card.Header>

                <Card.Body className="p-0 overflow-auto" style={{ maxHeight: '500px' }}>
                  {transactions.map((tx, idx) => (
                    <div key={tx._id || idx} className="p-3 border-bottom d-flex justify-content-between align-items-center px-4" style={{ backgroundColor: '#fdfdfd' }}>
                      <div className="d-flex align-items-center gap-3">
                        <span className={`badge ${tx.type === 'deposit' ? 'bg-success' : 'bg-warning text-dark'} text-uppercase py-2`}>
                          {tx.type}
                        </span>
                        <div>
                          <h6 className="mb-0 fw-bold text-dark">{tx.userId?.name || 'Unknown User'}</h6>
                          <small className="text-muted font-monospace">A/C: {tx.userId?.accountNumber || 'X'}</small>
                        </div>
                      </div>
                      <div className="text-end">
                        <h5 className={`mb-0 fw-bold font-monospace ${tx.type === 'deposit' ? 'text-success' : 'text-warning'}`}>
                          {tx.type === 'deposit' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                        </h5>
                        <small className="text-muted text-uppercase" style={{ fontSize: '0.7rem' }}>
                          {new Date(tx.timestamp).toLocaleTimeString('en-IN')}
                        </small>
                      </div>
                    </div>
                  ))}
                  {transactions.length === 0 && (
                     <div className="p-5 text-center text-muted">Awaiting transactions...</div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        );
      case 'users':
        return (
          <Card className="custom-card border-0 shadow-sm">
            <Card.Header className="bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">Manage Users</h5>
              <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>+ Create Account</Button>
            </Card.Header>
            <Card.Body className="p-0">
               <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">A/C Number</th>
                      <th className="px-4 py-3 text-end">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id}>
                        <td className="px-4 py-3 fw-bold">{u.name}</td>
                        <td className="px-4 py-3 text-muted">{u.email}</td>
                        <td className="px-4 py-3 font-monospace">{u.accountNumber}</td>
                        <td className="px-4 py-3 text-end fw-bold text-success">₹{(u.balance || 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-end">
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="me-2"
                            onClick={() => { setSelectedUser(u); setEditData({ name: u.name, email: u.email, accountNumber: u.accountNumber, pin: '' }); setShowEditModal(true); }}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="outline-info" 
                            size="sm" 
                            className="me-2"
                            onClick={() => fetchUserHistory(u)}
                          >
                            History
                          </Button>
                          <Button 
                            variant="outline-success" 
                            size="sm" 
                            className="me-2"
                            onClick={() => { setSelectedUser(u); setCashType('deposit'); setShowCashModal(true); }}
                          >
                            cash Manage
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDeleteUser(u._id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
               </div>
            </Card.Body>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <Container fluid className="vh-100 d-flex flex-column p-0 overflow-hidden">
      {/* Top Navbar */}
      <div className="bg-white shadow-sm px-4 py-3 d-flex justify-content-between align-items-center border-bottom z-1">
        <div>
          <h4 className="mb-0 text-success fw-bold">SB Admin Portal</h4>
        </div>
        <div className="d-flex align-items-center gap-3">
           <span className="text-muted small d-none d-md-inline">Logged in as Administrator</span>
           <Button variant="outline-danger" size="sm" onClick={logout} className="custom-btn">
            Sign Out
          </Button>
        </div>
      </div>

      <Row className="flex-grow-1 m-0 overflow-hidden">
        {/* Sidebar */}
        <Col md={3} lg={2} className="bg-white border-end p-0 d-flex flex-column" style={{ zIndex: 0 }}>
          <div className="p-4 border-bottom bg-light">
            <p className="text-muted text-uppercase small fw-bold mb-2">Network Stats</p>
            <div className="mb-3">
              <h2 className="fw-bold text-success m-0">
                ₹{transactions.reduce((acc, tx) => acc + tx.amount, 0).toLocaleString('en-IN')}
              </h2>
              <small className="text-muted">Total Volume</small>
            </div>
            <div>
              <h4 className="fw-bold m-0">{users.length}</h4>
              <small className="text-muted">Active Users</small>
            </div>
          </div>
          
          <div className="nav flex-column nav-pills p-3 flex-grow-1">
            <button 
              className={`nav-link text-start py-3 mb-2 fw-bold ${activeTab === 'dashboard' ? 'active bg-success' : 'text-dark hover-bg-light'}`}
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Live Dashboard
            </button>
            <button 
              className={`nav-link text-start py-3 mb-2 fw-bold ${activeTab === 'users' ? 'active bg-success' : 'text-dark hover-bg-light'}`}
              onClick={() => setActiveTab('users')}
            >
              👥 User Management
            </button>
          </div>
        </Col>

        {/* Main Content Area */}
        <Col md={9} lg={10} className="p-4 p-md-5 overflow-auto bg-light">
           {renderContent()}
        </Col>
      </Row>

      {/* Create Account Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered backdrop="static" size="lg">
        <Modal.Header closeButton className="border-bottom-0 pb-0 pt-4 px-4">
          <Modal.Title className="fw-bold text-primary">Provision New Account</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleCreateUser}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small text-muted">Full Name</Form.Label>
                  <Form.Control type="text" placeholder="RAHUL R" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="custom-input py-2" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small text-muted">Email Address</Form.Label>
                  <Form.Control type="email" placeholder="rahul@example.com" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="custom-input py-2" />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold small text-muted">Login Password</Form.Label>
              <Form.Control type="password" placeholder="Min 8 characters" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="custom-input py-2" />
            </Form.Group>
            
            <hr className="my-4 text-muted opacity-25" />
            
            <Row>
              <Col md={6}>
                 <Form.Group className="mb-4">
                  <Form.Label className="fw-bold small text-muted">Generated Account Number</Form.Label>
                  <Form.Control type="text" placeholder="10 digits" required className="font-monospace custom-input py-2" value={formData.accountNumber} onChange={(e) => setFormData({...formData, accountNumber: e.target.value})} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold small text-muted">Secure Transaction PIN</Form.Label>
                  <Form.Control type="password" placeholder="4 digits" required maxLength={4} className="font-monospace custom-input py-2" value={formData.pin} onChange={(e) => setFormData({...formData, pin: e.target.value})} />
                </Form.Group>
              </Col>
            </Row>
            
            <div className="d-flex justify-content-end gap-3 mt-2">
              <Button variant="light" onClick={() => setShowCreateModal(false)} className="px-4 fw-bold text-muted">Cancel</Button>
              <Button variant="primary" type="submit" disabled={loading} className="px-5 custom-btn py-2 shadow-sm">
                {loading ? <Spinner animation="border" size="sm" /> : 'Provision Account'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Add Cash Modal */}
      <Modal show={showCashModal} onHide={() => { setShowCashModal(false); setCashAmount(''); }} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Manage Cash: {selectedUser?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form onSubmit={handleManageCash}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small text-muted">Action Type</Form.Label>
              <div className="d-flex gap-2">
                <Button 
                  variant={cashType === 'deposit' ? 'success' : 'outline-success'} 
                  className="flex-grow-1"
                  onClick={() => setCashType('deposit')}
                >
                  Deposit
                </Button>
                <Button 
                  variant={cashType === 'withdraw' ? 'danger' : 'outline-danger'} 
                  className="flex-grow-1"
                  onClick={() => setCashType('withdraw')}
                >
                  Withdraw
                </Button>
              </div>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-bold small text-muted">Amount (₹)</Form.Label>
              <Form.Control 
                type="number" 
                placeholder="Enter amount" 
                required 
                value={cashAmount} 
                onChange={(e) => setCashAmount(e.target.value)} 
                className="custom-input py-3 fs-3 text-center font-monospace"
              />
            </Form.Group>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="light" onClick={() => setShowCashModal(false)}>Cancel</Button>
              <Button variant={cashType === 'deposit' ? 'success' : 'danger'} type="submit" disabled={cashLoading}>
                {cashLoading ? <Spinner animation="border" size="sm" /> : `Confirm ${cashType}`}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* User History Modal */}
      <Modal show={showHistoryModal} onHide={() => { setShowHistoryModal(false); setUserHistory([]); }} size="lg" centered scrollable>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Transaction History: {selectedUser?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {historyLoading ? (
            <div className="p-5 text-center"><Spinner animation="border" /></div>
          ) : userHistory.length === 0 ? (
            <div className="p-5 text-center text-muted">No transactions found for this user.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3 text-end">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {userHistory.map(tx => (
                    <tr key={tx._id}>
                      <td className="px-4 py-3 font-monospace small">
                        {new Date(tx.timestamp).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                         <span className={`badge ${tx.type === 'deposit' ? 'bg-success' : 'bg-warning text-dark'} text-uppercase`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-end fw-bold ${tx.type === 'deposit' ? 'text-success' : 'text-warning'}`}>
                        {tx.type === 'deposit' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Edit User Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered backdrop="static" size="lg">
        <Modal.Header closeButton className="border-bottom-0 pb-0 pt-4 px-4">
          <Modal.Title className="fw-bold text-primary">Edit User Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form onSubmit={handleUpdateUser}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small text-muted">Full Name</Form.Label>
                  <Form.Control type="text" required value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} className="custom-input py-2" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small text-muted">Email Address</Form.Label>
                  <Form.Control type="email" required value={editData.email} onChange={(e) => setEditData({...editData, email: e.target.value})} className="custom-input py-2" />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                 <Form.Group className="mb-4">
                  <Form.Label className="fw-bold small text-muted">Account Number</Form.Label>
                  <Form.Control type="text" required className="font-monospace custom-input py-2" value={editData.accountNumber} onChange={(e) => setEditData({...editData, accountNumber: e.target.value})} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold small text-muted">New PIN (Leave blank to keep current)</Form.Label>
                  <Form.Control type="password" placeholder="4 digits" maxLength={4} className="font-monospace custom-input py-2" value={editData.pin} onChange={(e) => setEditData({...editData, pin: e.target.value})} />
                </Form.Group>
              </Col>
            </Row>
            
            <div className="d-flex justify-content-end gap-3 mt-2">
              <Button variant="light" onClick={() => setShowEditModal(false)} className="px-4 fw-bold text-muted">Cancel</Button>
              <Button variant="primary" type="submit" disabled={loading} className="px-5 custom-btn py-2 shadow-sm">
                {loading ? <Spinner animation="border" size="sm" /> : 'Save Changes'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

    </Container>
  );
}
