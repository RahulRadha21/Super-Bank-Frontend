import { useState } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import api from '../api';

export default function ActionModal({ show, type, onHide, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Clear data when opened/closed
  const handleExited = () => {
    setAmount('');
    setPin('');
    setError('');
    setSuccessMsg('');
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      await api.post('/tx/action', {
        action: type,
        amount: Number(amount),
        pin
      });
      setSuccessMsg(`Transaction successful!`);
      setTimeout(() => {
        onSuccess();
        onHide();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.msg || 'Transaction failed');
    }
    setLoading(false);
  };

  if (!type) return null;

  return (
    <Modal show={show} onHide={onHide} onExited={handleExited} centered backdrop="static">
      <Modal.Header closeButton className="border-bottom-0 pb-0">
        <Modal.Title className="text-capitalize">{type} Funds</Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-2 pb-4 px-4">
        {error && <Alert variant="danger" className="py-2">{error}</Alert>}
        {successMsg && <Alert variant="success" className="py-2">{successMsg}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Amount (₹)</Form.Label>
            <Form.Control 
              type="number" 
              min="1"
              required
              className="custom-input fs-5 font-monospace text-center" 
              placeholder="100.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Form.Group>
          
          <Form.Group className="mb-4">
            <Form.Label>Security PIN</Form.Label>
            <Form.Control 
              type="password" 
              maxLength="4"
              required
              className="custom-input text-center fs-4 font-monospace tracking-wider" 
              placeholder="••••"
              style={{ letterSpacing: '8px' }}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
          </Form.Group>

          <Button 
            type="submit" 
            variant={type === 'deposit' ? 'success' : 'primary'}
            disabled={loading}
            className="w-100 custom-btn py-2 text-capitalize"
          >
            {loading ? <Spinner animation="border" size="sm" /> : `Confirm ${type}`}
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
