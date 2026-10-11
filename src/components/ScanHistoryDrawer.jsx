import React, { useState, useMemo } from 'react';
import { 
  IconHistory, 
  IconX, 
  IconTrash, 
  IconCamera, 
  IconCheckCircle, 
  IconSparkles 
} from './Icons';
import { getScanHistory, deleteScanFromHistory, clearAllScanHistory } from '../utils/scanHistory';
import { useApp } from '../context/useApp';

export default function ScanHistoryDrawer({ isOpen, onClose, onSelectScan }) {
  const { t } = useApp();
  const [version, setVersion] = useState(0);

  const history = useMemo(() => {
    if (!isOpen) return [];
    return getScanHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, version]);

  const handleDelete = (id, e) => {
    e.stopPropagation();
    deleteScanFromHistory(id);
    setVersion((v) => v + 1);
  };

  const handleClearAll = () => {
    if (window.confirm(t('historyConfirmClear'))) {
      clearAllScanHistory();
      setVersion((v) => v + 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="history-drawer-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="history-drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="history-drawer-header">
          <div className="hd-title-group">
            <IconHistory size={20} className="hd-header-icon" />
            <div>
              <h3 className="hd-title">{t('historyTitle')}</h3>
              <span className="hd-count">{t('historyCount', { count: history.length })}</span>
            </div>
          </div>
          <button 
            type="button" 
            className="hd-close-btn" 
            onClick={onClose}
            aria-label={t('close')}
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Privacy & Local Storage Badge */}
        <div className="hd-privacy-badge">
          <IconCheckCircle size={14} className="privacy-badge-icon" />
          <span>{t('savedOnDevice')}</span>
        </div>

        {/* Drawer Content */}
        <div className="history-drawer-body">
          {history.length === 0 ? (
            <div className="history-empty-state">
              <div className="empty-icon-circle">
                <IconCamera size={28} />
              </div>
              <p className="empty-text">{t('historyEmpty')}</p>
            </div>
          ) : (
            <div className="history-items-list">
              {history.map((item) => (
                <div 
                  key={item.id} 
                  className="history-item-card"
                  onClick={() => {
                    if (item.fullResult && onSelectScan) {
                      onSelectScan(item.fullResult);
                      onClose();
                    }
                  }}
                  tabIndex={0}
                  role="button"
                >
                  {/* Thumbnail */}
                  <div className="history-item-thumb">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt={item.cropName} />
                    ) : (
                      <div className="thumb-fallback">
                        <IconCamera size={20} />
                      </div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="history-item-info">
                    <div className="hi-top-row">
                      <span className="hi-crop-badge">{item.cropName}</span>
                      {item.isAiInference && (
                        <span className="hi-ai-badge">
                          <IconSparkles size={10} />
                          <span>Gemini AI</span>
                        </span>
                      )}
                    </div>
                    <strong className="hi-candidate-title">{item.topCandidate}</strong>
                    <div className="hi-meta-row">
                      <span className="hi-timestamp">{item.timestamp}</span>
                      <span className="hi-severity">{item.severity}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="history-item-actions">
                    <button
                      type="button"
                      className="btn-hi-delete"
                      onClick={(e) => handleDelete(item.id, e)}
                      title={t('historyDeleteBtn')}
                    >
                      <IconTrash size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {history.length > 0 && (
          <div className="history-drawer-footer">
            <button
              type="button"
              className="btn-clear-history"
              onClick={handleClearAll}
            >
              <IconTrash size={15} />
              <span>{t('historyClearAll')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
