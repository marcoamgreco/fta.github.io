import React from 'react';
import type { NodeProps } from 'reactflow';
import { Handle, Position, NodeResizer } from 'reactflow';

type CustomNodeData = {
  label: string;
  isBasic: boolean;
  status?: 'complete' | 'partial' | 'none';
  isRoot?: boolean;
  parentIsComplete?: boolean;
  onAddEvent: () => void;
  onAddBasicEvent: () => void;
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

  const baseStyle: React.CSSProperties = {
    padding: '10px 10px',
    fontSize: '10px',
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
      fontSize: '9px',
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
              border: '1px solid #3b82f6',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: data.isBasic ? '9px' : '10px',
              textAlign: 'center',
              outline: 'none',
              background: '#fff',
              color: '#000',
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div style={{
            wordBreak: 'break-word',
            color: '#000',
            fontSize: data.isBasic ? '9px' : '10px',
            lineHeight: '1.4',
            width: '100%',
          }}>
            {data.label}
          </div>
        )}

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
            {!data.isBasic && (
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

        <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
      </div>
    </>
  );
};

export default CustomNode;
