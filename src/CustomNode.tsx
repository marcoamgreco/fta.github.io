import React from 'react';
import type { NodeProps } from 'reactflow';
import { Handle, Position, NodeResizer } from 'reactflow';

type CustomNodeData = {
  label: string;
  isBasic: boolean;
  isTerminator?: boolean;
  status?: 'complete' | 'partial' | 'none';
  isRoot?: boolean;
  parentIsComplete?: boolean;
  description?: string;
  onAddEvent: () => void;
  onAddBasicEvent: () => void;
  onAddTerminator?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onLabelChange?: (newLabel: string) => void;
};

const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({ data, selected }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(data.label);
  const hideTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 150);
  };

  React.useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  React.useEffect(() => {
    setEditValue(data.label);
  }, [data.label]);

  // Ativar edição automaticamente quando o nó está selecionado e o usuário começa a digitar
  React.useEffect(() => {
    if (!selected || isEditing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar se houver um input, textarea ou elemento editável focado
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          (activeElement as HTMLElement).isContentEditable)
      ) {
        return;
      }

      // Ignorar teclas especiais (Ctrl, Alt, Meta, Shift, etc.)
      if (
        e.ctrlKey ||
        e.altKey ||
        e.metaKey ||
        e.key === 'Tab' ||
        e.key === 'Escape' ||
        e.key === 'Enter' ||
        e.key.startsWith('Arrow') ||
        e.key === 'F1' ||
        e.key === 'F2' ||
        e.key === 'F3' ||
        e.key === 'F4' ||
        e.key === 'F5' ||
        e.key === 'F6' ||
        e.key === 'F7' ||
        e.key === 'F8' ||
        e.key === 'F9' ||
        e.key === 'F10' ||
        e.key === 'F11' ||
        e.key === 'F12'
      ) {
        return;
      }

      // Se for um caractere imprimível, ativar edição
      if (e.key.length === 1) {
        e.preventDefault();
        setIsEditing(true);
        // Substituir o texto pelo caractere digitado (como se tivesse selecionado tudo)
        setEditValue(e.key);
        // Focar no input após um pequeno delay para garantir que foi renderizado
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            // Posicionar o cursor no final
            inputRef.current.setSelectionRange(1, 1);
          }
        }, 0);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        // Se for Backspace ou Delete, ativar edição e limpar o texto
        e.preventDefault();
        setIsEditing(true);
        setEditValue('');
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selected, isEditing]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editValue.trim() && data.onLabelChange) {
      data.onLabelChange(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(data.label);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // Border logic: selected > status colors > root/parent complete (black) > default gray
  const getBorderColor = (): string => {
    if (selected) return '#3b82f6';
    if (data.status === 'complete') return '#10b981';
    if (data.status === 'partial') return '#f59e0b';
    if (data.isRoot || data.parentIsComplete) return '#000';
    return '#ccc';
  };

  // Calculate font size based on text length
  const getFontSize = (text: string, isBasic: boolean): string => {
    const length = text.length;
    const baseSize = isBasic ? 9 : 10;

    if (length > 60) return `${Math.max(6, baseSize - 3)}px`;
    if (length > 40) return `${Math.max(7, baseSize - 2)}px`;
    if (length > 20) return `${Math.max(8, baseSize - 1)}px`;

    return `${baseSize}px`;
  };

  const currentFontSize = getFontSize(data.label, data.isBasic);

  const baseStyle: React.CSSProperties = {
    padding: '10px 10px',
    fontSize: currentFontSize,
    textAlign: 'center',
    background: data.status === 'complete'
      ? '#d1fae5'
      : data.status === 'partial'
        ? '#fef3c7'
        : '#fff',
    border: `2px solid ${getBorderColor()}`,
    boxShadow: selected ? '0 0 0 4px rgba(59, 130, 246, 0.2)' : 'none',
    position: 'relative',
    transition: 'all 0.2s',
    color: '#000',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
  };

  const nodeStyle: React.CSSProperties = data.isBasic
    ? {
      ...baseStyle,
      borderRadius: '50%',
      padding: '10px',
    }
    : data.isTerminator
      ? {
        ...baseStyle,
        borderRadius: '0px',
        padding: '0px',
        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
      }
      : {
        ...baseStyle,
        borderRadius: '0px',
        padding: '15px 20px',
      };

  return (
    <>
      <NodeResizer
        color="#3b82f6"
        isVisible={selected}
        minWidth={100}
        minHeight={50}
      />
      <div
        style={nodeStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Handle type="target" position={Position.Top} style={{ background: '#555' }} />

        <div style={{
          transform: data.isTerminator ? 'rotate(-45deg)' : 'none',
          width: data.isTerminator ? '100%' : '100%',
          height: data.isTerminator ? '100%' : '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: data.isTerminator ? '15px 20px' : '0',
        }}>
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              style={{
                width: '100%',
                border: 'none',
                borderRadius: '0',
                padding: '0',
                fontSize: currentFontSize,
                textAlign: 'center',
                outline: 'none',
                background: 'transparent',
                color: '#000',
                wordBreak: 'break-word',
                lineHeight: '1.4',
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div style={{
              wordBreak: 'break-word',
              color: '#000',
              fontSize: currentFontSize,
              lineHeight: '1.4',
              width: '100%',
            }}>
              {data.label}
            </div>
          )}
        </div>

        {/* Hover Toolbar */}
        {isHovered && !isEditing && (
          <div
            style={{
              position: 'absolute',
              top: '-38px',
              right: '0x',
              display: 'flex',
              gap: '3px',
              background: 'white',
              padding: '4px',
              borderRadius: '6px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              zIndex: 1000,
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {!data.isBasic && !data.isTerminator && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    data.onAddEvent();
                  }}
                  title="Adicionar Evento"
                  style={{
                    padding: '4px 6px',
                    fontSize: '12px',
                    color: '#1e40af',
                    background: '#dbeafe',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#bfdbfe';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#dbeafe';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  📦
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    data.onAddBasicEvent();
                  }}
                  title="Adicionar Causa Básica"
                  style={{
                    padding: '4px 6px',
                    fontSize: '12px',
                    color: '#166534',
                    background: '#dcfce7',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#bbf7d0';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#dcfce7';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  ⚫
                </button>
                {data.onAddTerminator && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      data.onAddTerminator?.();
                    }}
                    title="Adicionar Terminador"
                    style={{
                      padding: '4px 6px',
                      fontSize: '12px',
                      color: '#7c2d12',
                      background: '#fed7aa',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#fdba74';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#fed7aa';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    ◆
                  </button>
                )}
              </>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditClick();
              }}
              title="Editar"
              style={{
                padding: '4px 6px',
                fontSize: '12px',
                color: '#7c3aed',
                background: '#f3e8ff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e9d5ff';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f3e8ff';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              ✏️
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onDelete();
              }}
              title="Remover"
              style={{
                padding: '4px 6px',
                fontSize: '12px',
                color: '#991b1b',
                background: '#fee2e2',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#fecaca';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fee2e2';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              🗑️
            </button>
          </div>
        )}

        {!data.isTerminator && (
          <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
        )}

        {/* Description Indicator */}
        {data.description && data.description.trim() && (
          <div
            style={{
              position: 'absolute',
              bottom: '4px',
              right: '4px',
              fontSize: '14px',
              opacity: 1,
              pointerEvents: 'none',
              zIndex: 1,
              filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))',
            }}
            title="Este evento possui descrição"
          >
            📄
          </div>
        )}
      </div>
    </>
  );
};

export default CustomNode;
