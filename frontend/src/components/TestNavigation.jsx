import React from 'react';
import { useNavigate } from 'react-router-dom';

const TESTS = [
  { id: 'face', label: 'Face (1/4)', path: '/test-facial' },
  { id: 'arm-right', label: 'Braço Direito (2/4)', path: '/test-arm-right' },
  { id: 'arm-left', label: 'Braço Esquerdo (3/4)', path: '/test-arm-left' },
  { id: 'speech', label: 'Fala (4/4)', path: '/test-speech' },
];

export default function TestNavigation({ currentTest }) {
  const navigate = useNavigate();

  return (
    <div className="test-navigation">
      {TESTS.map((test) => (
        <button
          key={test.id}
          type="button"
          className={`button outline small ${test.id === currentTest ? 'active' : ''}`}
          onClick={() => {
            if (test.id !== currentTest) {
              navigate(test.path);
            }
          }}
          disabled={test.id === currentTest}
        >
          {test.label}
        </button>
      ))}
    </div>
  );
}
