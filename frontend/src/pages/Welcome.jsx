import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

export default function Welcome() {
  const navigate = useNavigate();
  const { getAllUsers, loginUser, deleteUser } = useApp();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const users = getAllUsers();

  const handleLoginUser = (userId) => {
    loginUser(userId);
    navigate('/dashboard');
  };

  const handleCreateNewUser = () => {
    navigate('/register');
  };

  const handleDeleteUser = (userId) => {
    deleteUser(userId);
    setShowDeleteConfirm(null);
  };

  const getRiskLevel = (riskScore) => {
    if (riskScore >= 15) return { level: 'ALTO', color: '#dc3545' };
    if (riskScore >= 8) return { level: 'MODERADO', color: '#ffc107' };
    return { level: 'BAIXO', color: '#28a745' };
  };

  return (
    <div className={`container ${users.length === 0 ? 'welcome-screen' : ''}`}>
      <div className="text-center mb-3">
        <h1 className="brand-title">
          <span className="brand-title__main">Avisa</span>
          <span className="brand-title__accent">VC</span>
        </h1>
        <p style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '0.02em' }}>
          Sistema inteligente de monitoramento e pré-triagem
        </p>
        <p className="mb-2" style={{ opacity: 0.8, fontWeight: 700 }}>
          para sua segurança e tranquilidade
        </p>
      </div>

      {users.length > 0 && (
        <>
          <h2 style={{ marginBottom: '16px', fontSize: '1.5rem' }}>Usuários Existentes</h2>

          {users.map((user) => {
            const riskLevel = getRiskLevel(user.riskScore || 0);
            const hasProfile = user.baselineVoice && user.baselineFace;

            return (
              <div key={user.id} className="card" style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <div style={{ fontSize: '2rem' }}>👤</div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{user.name}</h3>
                        <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>
                          {user.age} anos
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '0.9rem' }}>
                      <div>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          background: `${riskLevel.color}22`,
                          color: riskLevel.color,
                          fontWeight: '600',
                          fontSize: '0.8rem'
                        }}>
                          Risco: {riskLevel.level}
                        </span>
                      </div>
                      <div>
                        {hasProfile ? (
                          <span style={{ color: 'var(--primary-green)' }}>✓ Perfil completo</span>
                        ) : (
                          <span style={{ color: 'var(--warning-yellow)' }}>⚠ Perfil incompleto</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      className="button green"
                      style={{ fontSize: '0.9rem', padding: '8px 16px' }}
                      onClick={() => handleLoginUser(user.id)}
                    >
                      ENTRAR
                    </button>
                    <button
                      className="button outline"
                      style={{
                        fontSize: '0.9rem',
                        padding: '8px 16px',
                        borderColor: 'var(--primary-red)',
                        color: 'var(--primary-red)'
                      }}
                      onClick={() => setShowDeleteConfirm(user.id)}
                    >
                      EXCLUIR
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}

      {users.length === 0 && (
        <div className="card">
          <h2>Recursos Principais</h2>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">🛡️</div>
              <div className="feature-content">
                <h3>Proteção 24/7</h3>
                <p>Monitoramento contínuo e detecção automática de quedas</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">⚡</div>
              <div className="feature-content">
                <h3>Testes Rápidos</h3>
                <p>Avaliação de sinais de AVC em menos de 1 minuto</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">📞</div>
              <div className="feature-content">
                <h3>Contato de Emergência</h3>
                <p>Acionamento automático de socorro</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        className="button purple large mt-3"
        onClick={handleCreateNewUser}
      >
        + CRIAR NOVO USUÁRIO
      </button>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: '400px', margin: 0 }}>
            <h3 style={{ marginBottom: '16px' }}>Confirmar Exclusão</h3>
            <p className="mb-3">
              Tem certeza que deseja excluir este usuário? Todos os dados serão perdidos permanentemente.
            </p>
            <div style={{ display: 'grid', gap: '8px' }}>
              <button
                className="button"
                style={{ background: 'var(--primary-red)' }}
                onClick={() => handleDeleteUser(showDeleteConfirm)}
              >
                SIM, EXCLUIR
              </button>
              <button
                className="button outline"
                onClick={() => setShowDeleteConfirm(null)}
              >
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}

      <footer>
        <small>Este app não substitui atendimento médico profissional</small>
      </footer>
    </div>
  );
}
