import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

const ActionTile = ({
  icon,
  title,
  variant = '',
  onClick,
  disabled
}) => {
  const tileClass = ['action-tile', variant].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={tileClass}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="action-tile__icon" aria-hidden="true">{icon}</span>
      <span className="action-tile__title">{title}</span>
    </button>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, riskScore, baselineVoice, baselineFace, getRiskLevel, logoutUser } = useApp();
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);

  const riskLevel = getRiskLevel();
  const hasProfile = baselineVoice && baselineFace;

  const handleEmergencyCall = () => {
    setShowEmergencyConfirm(true);
  };

  const confirmEmergency = () => {
    // In production, this would trigger actual emergency call
    const emergencyNumber = user?.emergencyContact?.phone || '192';
    alert(`Ligando para emergência: ${emergencyNumber}\n\nEm produção, isso iniciaria uma ligação real.`);
    setShowEmergencyConfirm(false);
    navigate('/results-attention');
  };

  const handleStartTest = () => {
    if (!hasProfile) {
      alert('Você precisa criar seu perfil antes de fazer os testes.');
      navigate('/voice-recording');
      return;
    }
    navigate('/test-facial');
  };

  const handleSwitchUser = () => {
    logoutUser();
    navigate('/');
  };

  const voiceStatus = baselineVoice ? 'calibrada' : 'pendente';
  const faceStatus = baselineFace ? 'calibrado' : 'pendente';
  const profileStatusText = hasProfile ? 'Perfil completo' : 'Complete seu perfil';
  const profileHelper = hasProfile
    ? 'Tudo pronto para testes FAST'
    : 'Calibre voz e rosto para habilitar os testes';
  const firstName = user?.name
    ? user.name.trim().split(/\s+/)[0]
    : 'Usuário';

  return (
    <div className="container">
      {/* Hero Section */}
      <div className="card dashboard-hero hero-compact">
        <div className="hero-header">
          <div>
            <div className="hero-greeting">
              <span className="hero-greeting__badge">Olá</span>
              <h1>{firstName}</h1>
            </div>
            <p className="text-muted mb-0">
              <span className="brand-inline">
                <span className="brand-inline__main">Avisa</span>
                <span className="brand-inline__accent">VC</span>
              </span>{' '}
              está cuidando de você ❤️
            </p>
          </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="card action-panel highlight-panel">
        <h3 className="action-panel__title">Atalhos Rápidos</h3>

        <div className="action-grid">
          <ActionTile
            icon="🚨"
            title="Acionar emergência"
            variant="danger"
            onClick={handleEmergencyCall}
          />

          <ActionTile
            icon="🧪"
            title="Iniciar teste FAST"
            variant="primary"
            onClick={handleStartTest}
            disabled={!hasProfile}
          />

          <ActionTile
            icon="🎯"
            title="Recalibrar perfil"
            variant="success"
            onClick={() => navigate('/voice-recording')}
          />
        </div>
      </div>

      {/* Account Utilities */}
      <div className="card utility-panel hero-utilities">
        <p className="eyebrow mb-1">Conta</p>
        <div className="hero-actions">
          <button
            className="button outline utility-button"
            onClick={() => alert('Configurações em desenvolvimento')}
          >
            ⚙️ Configurações
          </button>
          <button
            className="button outline utility-button"
            onClick={handleSwitchUser}
          >
            👥 Trocar Usuário
          </button>
        </div>
      </div>

      {/* Risk & Profile Status */}
      <div className="card status-panel">
        <p className="eyebrow mb-1">Monitoramento</p>
        <h3 style={{ marginBottom: '16px' }}>Como você está hoje</h3>
        <div className="hero-status-grid">
          <div
            className="status-pill"
            style={{
              borderColor: riskLevel.color,
              background: `${riskLevel.color}12`
            }}
          >
            <span className="eyebrow">Nível de risco</span>
            <strong style={{ color: riskLevel.color }}>{riskLevel.level}</strong>
            <small>Pontuação {riskScore}/40</small>
            {riskLevel.level === 'ALTO' && (
              <p className="text-danger mb-0 mt-1" style={{ fontWeight: 600 }}>
                ⚠️ Atenção redobrada recomendada
              </p>
            )}
          </div>
          <div className="status-pill">
            <span className="eyebrow">Status do perfil</span>
            <strong>{profileStatusText}</strong>
            <small>{profileHelper}</small>

            <div className="status-list mt-2">
              <div className="status-badge">
                <span className={`status-dot ${baselineVoice ? 'ok' : 'pending'}`} aria-hidden="true"></span>
                <span>Voz {voiceStatus}</span>
              </div>
              <div className="status-badge">
                <span className={`status-dot ${baselineFace ? 'ok' : 'pending'}`} aria-hidden="true"></span>
                <span>Rosto {faceStatus}</span>
              </div>
            </div>

            {!hasProfile && (
              <button
                type="button"
                className="link-button mt-2"
                onClick={() => navigate('/voice-recording')}
              >
                Configurar agora
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      {user?.emergencyContact && (
        <div className="card contact-card">
          <div>
            <p className="eyebrow">Contato de emergência</p>
            <h3 style={{ marginBottom: '4px' }}>{user.emergencyContact.name}</h3>
            <p className="text-muted mb-0">{user.emergencyContact.phone}</p>
          </div>
          <div className="contact-icon" aria-hidden="true">📞</div>
        </div>
      )}

      {/* Quick Info */}
      <div className="card info-card">
        <h3 style={{ marginBottom: '12px' }}>Protocolo FAST</h3>
        <div className="fast-grid">
          <div>
            <span className="eyebrow">F - Face</span>
            <p className="mb-0">Observe o rosto e veja se há assimetria.</p>
          </div>
          <div>
            <span className="eyebrow">A - Arms</span>
            <p className="mb-0">Levante ambos os braços e note fraqueza.</p>
          </div>
          <div>
            <span className="eyebrow">S - Speech</span>
            <p className="mb-0">Fale uma frase e note dificuldade.</p>
          </div>
          <div>
            <span className="eyebrow">T - Time</span>
            <p className="mb-0">Se notar algo, acione emergência imediatamente.</p>
          </div>
        </div>
      </div>

      {/* Emergency Confirmation Modal */}
      {showEmergencyConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
            <div className="icon danger">⚠️</div>
            <h2 style={{ textAlign: 'center', marginBottom: '16px' }}>
              Confirmar Emergência
            </h2>
            <p style={{ textAlign: 'center', marginBottom: '24px' }}>
              Deseja acionar o contato de emergência?
            </p>
            <p className="text-muted" style={{ textAlign: 'center', marginBottom: '24px' }}>
              {user?.emergencyContact
                ? `Ligará para: ${user.emergencyContact.name}`
                : 'Ligará para: 192 (SAMU)'
              }
            </p>
            <button
              className="button mb-2"
              onClick={confirmEmergency}
            >
              SIM, LIGAR AGORA
            </button>
            <button
              className="button white"
              onClick={() => setShowEmergencyConfirm(false)}
            >
              CANCELAR
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
