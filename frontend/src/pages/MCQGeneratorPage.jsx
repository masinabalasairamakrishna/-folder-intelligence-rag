import React, { useState, useEffect } from 'react';
import { folderApi, aiApi } from '../services/api';
import { 
  HelpCircle, Sparkles, CheckCircle2, XCircle, Award, 
  RotateCcw, Loader2, BookOpen, FileText, Folder
} from 'lucide-react';

export default function MCQGeneratorPage() {
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [revealed, setRevealed] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      const res = await folderApi.list();
      setFolders(res.data);
      if (res.data.length > 0) {
        setSelectedFolderId(res.data[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateQuiz = async () => {
    setError('');
    setLoading(true);
    setQuestions([]);
    setSelectedAnswers({});
    setRevealed({});

    try {
      const res = await aiApi.generateMCQs({
        folder_id: parseInt(selectedFolderId),
        num_questions: 5
      });
      setQuestions(res.data.questions || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate quiz. Ensure folder has indexed documents.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (qIdx, option) => {
    if (revealed[qIdx]) return;
    setSelectedAnswers(prev => ({ ...prev, [qIdx]: option }));
  };

  const handleRevealAnswer = (qIdx) => {
    setRevealed(prev => ({ ...prev, [qIdx]: true }));
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct_answer) {
        score++;
      }
    });
    return score;
  };

  const totalAnswered = Object.keys(revealed).length;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <HelpCircle className="w-6 h-6 text-purple-400" />
          <span>Automatic MCQ & Revision Flashcard Generator</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Generate exam-level multiple choice questions grounded strictly in your folder's documents with instant feedback and page citations.
        </p>
      </div>

      {/* Controls */}
      <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <label className="block text-xs text-slate-300 mb-1.5 font-medium">Select Folder for Quiz Generation</label>
            <select
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-navy-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
            >
              {folders.map(f => (
                <option key={f.id} value={f.id}>{f.name} ({f.document_count} files)</option>
              ))}
            </select>
          </div>

          <div className="pt-2 sm:pt-5">
            <button
              onClick={handleGenerateQuiz}
              disabled={loading || !selectedFolderId}
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 transition flex items-center gap-2 disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing MCQs from Vectors...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate 5 Practice MCQs</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Quiz Area */}
      {questions.length > 0 && (
        <div className="space-y-6 animate-fadeIn">
          {/* Score Header */}
          <div className="glass-panel p-4 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-purple-300 font-semibold">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Questions Completed: {totalAnswered} / {questions.length}</span>
            </div>
            {totalAnswered === questions.length && (
              <div className="text-emerald-400 font-bold text-sm">
                Final Score: {calculateScore()} / {questions.length} ({Math.round((calculateScore() / questions.length) * 100)}%)
              </div>
            )}
          </div>

          {/* Question Cards */}
          {questions.map((q, qIdx) => {
            const isRevealed = !!revealed[qIdx];
            const chosenOption = selectedAnswers[qIdx];

            return (
              <div key={qIdx} className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-lg bg-purple-600/20 text-purple-400 font-bold flex items-center justify-center text-xs flex-shrink-0 border border-purple-500/30">
                      {qIdx + 1}
                    </span>
                    <h3 className="text-sm font-semibold text-white leading-relaxed">
                      {q.question}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 flex-shrink-0">
                    {q.source_document} {q.source_page ? `(p.${q.source_page})` : ''}
                  </span>
                </div>

                {/* Options List */}
                <div className="grid grid-cols-1 gap-2 pt-2">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = chosenOption === opt;
                    const isCorrect = opt === q.correct_answer;

                    let btnStyle = 'bg-navy-950/60 border-white/5 text-slate-300 hover:bg-white/5';
                    if (isRevealed) {
                      if (isCorrect) {
                        btnStyle = 'bg-emerald-950/70 border-emerald-500 text-emerald-200 font-semibold';
                      } else if (isSelected && !isCorrect) {
                        btnStyle = 'bg-rose-950/70 border-rose-500 text-rose-200';
                      }
                    } else if (isSelected) {
                      btnStyle = 'bg-purple-600/30 border-purple-500 text-white font-medium';
                    }

                    return (
                      <button
                        key={oIdx}
                        disabled={isRevealed}
                        onClick={() => handleSelectOption(qIdx, opt)}
                        className={`p-3 rounded-xl border text-left text-xs transition flex items-center justify-between ${btnStyle}`}
                      >
                        <span>{opt}</span>
                        {isRevealed && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        {isRevealed && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400" />}
                      </button>
                    );
                  })}
                </div>

                {/* Action / Explanation Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-white/5">
                  {!isRevealed ? (
                    <button
                      onClick={() => handleRevealAnswer(qIdx)}
                      disabled={!chosenOption}
                      className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-purple-300 border border-purple-500/30 text-xs font-semibold self-start transition disabled:opacity-40"
                    >
                      Check Answer & Reveal Explanation
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-navy-950/80 border border-white/5 text-xs text-slate-300 w-full space-y-1">
                      <div className="font-semibold text-purple-300 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Explanation & Document Evidence:</span>
                      </div>
                      <p className="text-slate-400 leading-relaxed font-sans">{q.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
