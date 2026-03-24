import { useMemo, useState } from 'react';
import { SoundRequest } from '../types';

type RequestComment = {
  id: string;
  text: string;
  likes: number;
  parentId?: string;
};

interface RequestPageProps {
  requests: SoundRequest[];
  onAddRequest: (req: SoundRequest) => void;
  lang?: 'ru' | 'en';
}

export default function RequestPage({ requests, onAddRequest }: RequestPageProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, RequestComment[]>>({});
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(new Set());
  const [likedRequestIds, setLikedRequestIds] = useState<Set<string>>(new Set());
  const [requestLikes, setRequestLikes] = useState<Record<string, number>>({});

  const selected = useMemo(
    () => requests.find((r) => r.id === selectedId) || null,
    [requests, selectedId],
  );

  const handleSubmit = () => {
    if (!title.trim()) return;
    const req: SoundRequest = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      requestedAt: new Date(),
    };
    onAddRequest(req);
    setSelectedId(req.id);
    setTitle('');
    setDescription('');
    setSubmitted(true);
    window.setTimeout(() => setSubmitted(false), 2400);
  };

  const handleSendComment = () => {
    if (!selected || !commentText.trim()) return;
    const row: RequestComment = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      text: commentText.trim(),
      likes: 0,
      parentId: replyTo || undefined,
    };
    setComments((prev) => ({
      ...prev,
      [selected.id]: [row, ...(prev[selected.id] || [])],
    }));
    setCommentText('');
    setReplyTo(null);
  };

  return (
    <div style={{ padding: '24px 24px 100px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: 10 }}>Запросить музыку</h1>
      <p style={{ color: '#666', fontSize: 14, marginBottom: 18 }}>
        Оставьте запрос, и он появится в карточках на этой странице.
      </p>

      {submitted && (
        <div style={{
          marginBottom: 14,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10,
          padding: '10px 12px',
          fontSize: 13,
        }}>
          Запрос добавлен
        </div>
      )}

      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10 }}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 100))}
            placeholder="Название запроса"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 220))}
            placeholder="Краткое описание"
          />
          <button className="btn-primary" onClick={handleSubmit} disabled={!title.trim()}>
            Отправить
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(420px, 1fr) minmax(360px, 420px)',
        gap: 14,
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12,
          padding: 12,
          minHeight: 500,
        }}>
          <div style={{ fontSize: 14, color: '#bbb', marginBottom: 10 }}>Карточки запросов</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 10 }}>
            {requests.map((req) => {
              const isActive = selectedId === req.id;
              const likes = requestLikes[req.id] || 0;
              const isLiked = likedRequestIds.has(req.id);
              return (
                <div
                  key={req.id}
                  onClick={() => setSelectedId(req.id)}
                  style={{
                    cursor: 'pointer',
                    borderRadius: 10,
                    border: isActive ? '1px solid rgba(255,255,255,0.24)' : '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.04)',
                    minHeight: 140,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ padding: '12px 12px 0' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8, lineHeight: 1.35 }}>
                      {req.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#8f8f8f', lineHeight: 1.45 }}>
                      {req.description || 'Описание не добавлено'}
                    </div>
                  </div>
                  <div style={{
                    marginTop: 10,
                    padding: '10px 12px',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <span style={{ fontSize: 11, color: '#666' }}>Anonymous</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isLiked) return;
                        setLikedRequestIds((prev) => new Set([...prev, req.id]));
                        setRequestLikes((prev) => ({ ...prev, [req.id]: (prev[req.id] || 0) + 1 }));
                      }}
                      style={{
                        border: '1px solid rgba(255,255,255,0.12)',
                        background: 'none',
                        color: isLiked ? '#fff' : '#aaa',
                        borderRadius: 7,
                        fontSize: 12,
                        padding: '5px 8px',
                        cursor: 'pointer',
                      }}
                    >
                      {isLiked ? `Лайк ${likes}` : `Лайк +1 (${likes})`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12,
          minHeight: 500,
          maxHeight: '72vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {selected ? (
            <>
              <div style={{ padding: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 8, background: 'rgba(255,255,255,0.08)' }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {selected.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#777', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {selected.description || 'Описание не добавлено'}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={replyTo ? 'Ответ...' : 'Написать комментарий...'}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                  />
                  <button className="btn-primary" onClick={handleSendComment}>OK</button>
                </div>
              </div>

              <div style={{ overflowY: 'auto', padding: 10 }}>
                {(comments[selected.id] || []).length === 0 && (
                  <div style={{ color: '#666', fontSize: 13 }}>Комментариев пока нет</div>
                )}
                {(comments[selected.id] || []).map((c) => (
                  <div
                    key={c.id}
                    style={{
                      marginBottom: 8,
                      marginLeft: c.parentId ? 18 : 0,
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 8,
                      padding: 9,
                    }}
                  >
                    <div style={{ fontSize: 13, color: '#ddd', marginBottom: 8 }}>{c.text}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-ghost" style={{ fontSize: 12, padding: '5px 8px' }} onClick={() => setReplyTo(c.id)}>Ответить</button>
                      <button
                        className="btn-ghost"
                        style={{ fontSize: 12, padding: '5px 8px' }}
                        onClick={() => {
                          if (likedCommentIds.has(c.id)) return;
                          setLikedCommentIds((prev) => new Set([...prev, c.id]));
                          setComments((prev) => ({
                            ...prev,
                            [selected.id]: (prev[selected.id] || []).map((x) => (x.id === c.id ? { ...x, likes: x.likes + 1 } : x)),
                          }));
                        }}
                      >
                        Лайк {c.likes}
                      </button>
                      <button
                        className="btn-ghost"
                        style={{ fontSize: 12, padding: '5px 8px', color: '#ff7777', borderColor: 'rgba(255,120,120,0.35)' }}
                        onClick={() => {
                          setComments((prev) => ({
                            ...prev,
                            [selected.id]: (prev[selected.id] || []).filter((x) => x.id !== c.id && x.parentId !== c.id),
                          }));
                        }}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ padding: 14, color: '#666', fontSize: 13 }}>Выберите карточку запроса, чтобы открыть комментарии</div>
          )}
        </div>
      </div>
    </div>
  );
}
