import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar as CalendarIcon, Clock, BellRing, BellOff, Plus, Search, Trash2, Edit3, ChevronLeft, ChevronRight } from 'lucide-react';

const STORAGE_KEY = 'smart_schedules';
const ANNI_STORAGE_KEY = 'smart_anniversaries';

export default function App() {
  const [schedules, setSchedules] = useState([]);
  const [anniversaries, setAnniversaries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());

  // Form State
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [alarm, setAlarm] = useState(false);
  const [alarmTime, setAlarmTime] = useState('');

  // Anniversary State
  const [anniMonth, setAnniMonth] = useState('01');
  const [anniDay, setAnniDay] = useState('01');
  const [anniTitle, setAnniTitle] = useState('');

  // Search & Pagination State
  const [searchStartDate, setSearchStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [searchEndDate, setSearchEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load Data
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSchedules(JSON.parse(stored));
      const storedAnni = localStorage.getItem(ANNI_STORAGE_KEY);
      if (storedAnni) setAnniversaries(JSON.parse(storedAnni));
    } catch (error) {
      console.error('Failed to parse from local storage:', error);
      setSchedules([]);
      setAnniversaries([]);
    }
  }, []);

  // Save Data
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem(ANNI_STORAGE_KEY, JSON.stringify(anniversaries));
  }, [anniversaries]);

  // Alarm Interval
  useEffect(() => {
    const notifyAlarm = (schedule) => {
      if (Notification.permission === 'granted') {
        new Notification('일정 알림', { body: schedule.title });
      } else {
        alert(`⏰ 일정 알림: ${schedule.title}\n${schedule.memo}`);
      }
    };

    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    const intervalId = setInterval(() => {
      const now = new Date();
      const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const currentDate = now.toISOString().split('T')[0];

      schedules.forEach(schedule => {
        if (schedule.alarm && schedule.date === currentDate && schedule.alarmTime === currentHourMin && !schedule.notified) {
          notifyAlarm(schedule);
          // Mark as notified so it doesn't trigger again
          setSchedules(prev => prev.map(s => s.id === schedule.id ? { ...s, notified: true } : s));
        }
      });
    }, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [schedules]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    if (alarm && !alarmTime) {
      alert('알람 시간을 설정해주세요.');
      return;
    }

    const newSchedule = {
      id: Date.now().toString(),
      date: selectedDate,
      title,
      memo,
      alarm,
      alarmTime: alarm ? alarmTime : null,
      notified: false,
    };

    setSchedules([...schedules, newSchedule]);
    setTitle('');
    setMemo('');
    setAlarm(false);
    setAlarmTime('');
  };

  const handleDelete = (id) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      setSchedules(schedules.filter(s => s.id !== id));
    }
  };

  const handleAnniSubmit = (e) => {
    e.preventDefault();
    if (!anniTitle.trim()) {
      alert('기념일 내용을 입력해주세요.');
      return;
    }
    const newAnni = {
      id: Date.now().toString(),
      date: `${anniMonth}-${anniDay}`,
      title: anniTitle
    };
    setAnniversaries([...anniversaries, newAnni]);
    setAnniTitle('');
  };

  const handleAnniDelete = (id) => {
    if (window.confirm('기념일을 삭제하시겠습니까?')) {
      setAnniversaries(anniversaries.filter(a => a.id !== id));
    }
  };

  const handleDateClick = (dateStr) => {
    if (selectedDate === dateStr) return;
    
    if (title.trim() || memo.trim()) {
      const confirmClear = window.confirm('다른 일자를 선택하면 작성 중인 내용이 지워집니다. 진행할까요?');
      if (confirmClear) {
        setTitle('');
        setMemo('');
        setAlarm(false);
        setAlarmTime('');
        setSelectedDate(dateStr);
      }
      // '아니오'인 경우 아무 작업도 하지 않아 기존 날짜에 커서 유지
    } else {
      setSelectedDate(dateStr);
    }
  };

  // Calendar Logic
  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const getCalendarDays = () => {
    const daysCount = daysInMonth(calYear, calMonth);
    const startDay = firstDayOfMonth(calYear, calMonth);

    const days = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= daysCount; i++) {
        const d = String(i).padStart(2, '0');
        const m = String(calMonth + 1).padStart(2, '0');
        days.push(`${calYear}-${m}-${d}`);
    }
    return days;
  };

  const PrevMonth = () => {
    setCalMonth(prev => {
      if (prev === 0) {
        setCalYear(y => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const NextMonth = () => {
    setCalMonth(prev => {
      if (prev === 11) {
        setCalYear(y => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  // Filtering
  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => {
      const matchDate = (!searchStartDate || s.date >= searchStartDate) && (!searchEndDate || s.date <= searchEndDate);
      const matchKeyword = searchKeyword ? s.title.includes(searchKeyword) || s.memo.includes(searchKeyword) : true;
      return matchDate && matchKeyword;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [schedules, searchStartDate, searchEndDate, searchKeyword]);

  // Pagination
  const paginatedSchedules = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSchedules.slice(start, start + itemsPerPage);
  }, [filteredSchedules, currentPage]);
  
  const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage);

  const schedulesForSelectedDate = schedules.filter(s => s.date === selectedDate);
  const anniversariesForSelectedDate = anniversaries.filter(a => selectedDate && selectedDate.endsWith(a.date));

  const hasScheduleOnDate = useCallback((dateStr) => {
    return schedules.some(s => s.date === dateStr);
  }, [schedules]);

  const getAnniversariesForDate = useCallback((dateStr) => {
    if (!dateStr) return [];
    return anniversaries.filter(a => dateStr.endsWith(a.date));
  }, [anniversaries]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-6 px-4 font-sans text-gray-800">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col h-[90vh]">
        
        {/* Header */}
        <header className="bg-blue-600 text-white p-5 flex items-center shadow-md z-10">
          <CalendarIcon className="w-6 h-6 mr-3" />
          <h1 className="text-xl font-bold tracking-wide">스마트 일정 관리 앱</h1>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6 custom-scrollbar">
          
          {/* Calendar Section */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex justify-between items-center mb-4">
              <button type="button" onClick={PrevMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft className="w-5 h-5" /></button>
              <h2 className="text-lg font-semibold">{calYear}년 {calMonth + 1}월</h2>
              <button type="button" onClick={NextMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronRight className="w-5 h-5" /></button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-500 mb-2">
              {['일', '월', '화', '수', '목', '금', '토'].map(d => <div key={d} className="py-1">{d}</div>)}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {getCalendarDays().map((dateStr, i) => (
                <div key={i} className="aspect-square flex items-center justify-center">
                  {dateStr ? (
                    <button
                      onClick={() => handleDateClick(dateStr)}
                      className={`relative w-full h-full flex flex-col items-center justify-center rounded-lg transition-all ${
                        selectedDate === dateStr 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : dateStr === new Date().toISOString().split('T')[0]
                            ? 'bg-green-100 text-green-800 font-bold border border-green-300'
                            : 'hover:bg-blue-50 text-gray-700'
                      }`}
                    >
                      <span className="text-sm">{parseInt(dateStr.split('-')[2])}</span>
                      {getAnniversariesForDate(dateStr).length > 0 && (
                        <span className={`text-[10px] leading-tight ${selectedDate === dateStr ? 'text-blue-100' : 'text-purple-500 font-semibold'} block truncate w-full px-1`}>
                          {getAnniversariesForDate(dateStr)[0].title}
                        </span>
                      )}
                      {hasScheduleOnDate(dateStr) && (
                        <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${selectedDate === dateStr ? 'bg-white' : 'bg-red-500'}`}></span>
                      )}
                    </button>
                  ) : <div />}
                </div>
              ))}
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* Selected Date Dashboard */}
          <section>
            <h3 className="text-lg font-semibold mb-3 flex items-center text-blue-800">
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">{selectedDate} 일정</span>
            </h3>
            
            <div className="space-y-3 mb-6">
              {schedulesForSelectedDate.length === 0 && anniversariesForSelectedDate.length === 0 ? (
                <p className="text-gray-400 text-center py-4 bg-gray-50 rounded-lg text-sm border border-dashed">등록된 일정이 없습니다.</p>
              ) : (
                <>
                  {anniversariesForSelectedDate.map(a => (
                    <div key={`anni-${a.id}`} className="bg-purple-50 border border-purple-200 rounded-xl p-3 shadow-sm flex items-center">
                       <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded mr-3">기념일</span>
                       <h4 className="font-bold text-purple-900">{a.title}</h4>
                    </div>
                  ))}
                  {schedulesForSelectedDate.map(s => (
                    <div key={s.id} className="bg-white border rounded-xl p-4 shadow-sm relative group hover:border-blue-300 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-gray-800 break-words">{s.title}</h4>
                          <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{s.memo}</p>
                        </div>
                        <button onClick={() => handleDelete(s.id)} className="text-gray-400 hover:text-red-500 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {s.alarm && (
                        <div className="flex items-center text-xs text-blue-500 mt-3 bg-blue-50 w-max px-2 py-1 rounded-md font-medium">
                          <BellRing className="w-3 h-3 mr-1" /> {s.alarmTime}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-inner">
              <h4 className="font-semibold text-gray-700 flex items-center mb-4"><Plus className="w-4 h-4 mr-1"/> 새 일정 등록</h4>
              
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="일정 제목"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition-shadow text-sm"
                />
                
                <textarea
                  placeholder="메모 (선택)"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition-shadow text-sm min-h-[80px] resize-y"
                />
                
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center text-sm font-medium text-gray-700">
                    {alarm ? <BellRing className="w-4 h-4 mr-2 text-blue-500" /> : <BellOff className="w-4 h-4 mr-2 text-gray-400" />}
                    알람 설정
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={alarm} onChange={() => setAlarm(!alarm)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {alarm && (
                  <div className="animate-fade-in-down">
                    <input
                      type="time"
                      value={alarmTime}
                      onChange={(e) => setAlarmTime(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition-shadow text-sm"
                    />
                  </div>
                )}

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg shadow-md transition-colors flex items-center justify-center mt-2">
                  <Plus className="w-5 h-5 mr-1" /> 추가하기
                </button>
              </div>
            </form>
          </section>

          <hr className="border-gray-200" />
          
          {/* Anniversary Registration */}
          <section>
            <form onSubmit={handleAnniSubmit} className="bg-purple-50 p-4 rounded-xl border border-purple-100 shadow-inner">
              <h4 className="font-semibold text-purple-800 flex items-center mb-4">🎉 기념일 등록</h4>
              
              <div className="flex space-x-2 mb-3">
                <select 
                  value={anniMonth} 
                  onChange={(e) => setAnniMonth(e.target.value)}
                  className="w-1/2 px-3 py-2 rounded-lg border border-purple-200 focus:ring-2 focus:ring-purple-400 outline-none text-sm"
                >
                  {[...Array(12)].map((_, i) => <option key={i+1} value={String(i+1).padStart(2, '0')}>{i+1}월</option>)}
                </select>
                <select 
                  value={anniDay} 
                  onChange={(e) => setAnniDay(e.target.value)}
                  className="w-1/2 px-3 py-2 rounded-lg border border-purple-200 focus:ring-2 focus:ring-purple-400 outline-none text-sm"
                >
                  {[...Array(31)].map((_, i) => <option key={i+1} value={String(i+1).padStart(2, '0')}>{i+1}일</option>)}
                </select>
              </div>
              <input
                type="text"
                placeholder="기념일 내용"
                value={anniTitle}
                onChange={(e) => setAnniTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-purple-200 focus:ring-2 focus:ring-purple-400 outline-none mb-3 text-sm"
              />
              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 rounded-lg shadow-md transition-colors text-sm">
                기념일 추가
              </button>
            </form>
            
            {anniversaries.length > 0 && (
              <div className="mt-4 space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                {anniversaries.sort((a,b)=> a.date.localeCompare(b.date)).map(a => (
                  <div key={a.id} className="flex justify-between items-center text-sm bg-white p-2 border rounded-lg">
                    <span className="font-medium text-purple-800 whitespace-nowrap shrink-0 min-w-fit mr-2">{a.date.includes('-') ? `${parseInt(a.date.split('-')[0], 10)}월 ${parseInt(a.date.split('-')[1], 10)}일` : a.date}</span>
                    <span className="flex-1 px-2 text-gray-700 truncate">{a.title}</span>
                    <button onClick={() => handleAnniDelete(a.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <hr className="border-gray-200" />

          {/* Search & Global View */}
          <section className="pb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center"><Search className="w-5 h-5 mr-2" /> 전체 일정 검색</h3>
            
            <div className="flex flex-col space-y-3 mb-4">
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={searchStartDate}
                  onChange={(e) => { setSearchStartDate(e.target.value); setCurrentPage(1); }}
                  className="flex-1 px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span className="text-gray-500 font-medium">~</span>
                <input
                  type="date"
                  value={searchEndDate}
                  onChange={(e) => { setSearchEndDate(e.target.value); setCurrentPage(1); }}
                  className="flex-1 px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="키워드 입력"
                  value={searchKeyword}
                  onChange={(e) => { setSearchKeyword(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                />
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              </div>
            </div>

            <div className="space-y-3">
              {paginatedSchedules.length === 0 ? (
                <p className="text-gray-500 text-sm py-6 text-center border rounded-xl bg-gray-50 border-dashed">검색 결과가 없습니다.</p>
              ) : (
                paginatedSchedules.map(s => (
                  <div key={s.id} className="bg-white border rounded-xl p-4 shadow-sm flex flex-col space-y-2">
                     <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">{s.date}</span>
                        <button onClick={() => handleDelete(s.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                     </div>
                     <h4 className="font-bold text-gray-800 text-sm break-words">{s.title}</h4>
                     {s.memo && <p className="text-xs text-gray-600 whitespace-pre-wrap">{s.memo}</p>}
                     {s.alarm && <p className="text-xs text-blue-500 flex items-center font-medium"><BellRing className="w-3 h-3 mr-1" /> {s.alarmTime}</p>}
                  </div>
                ))
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6 space-x-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-3 py-1 rounded-md bg-white border text-gray-600 disabled:opacity-50 hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-4 py-1 text-sm font-medium text-gray-700 border bg-white rounded-md flex items-center">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-3 py-1 rounded-md bg-white border text-gray-600 disabled:opacity-50 hover:bg-gray-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </section>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html:`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 10px;
        }
      `}} />
    </div>
  );
}
