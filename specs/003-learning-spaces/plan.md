# Triển khai

Giữ palette xanh/purple, header4mục. Ba component độc lập: LessonLibrary, LearningWorkspace, LumiChat; data TS typed + JSON snapshot nội dung demo. React escape text, không render HTML từ câu hỏi/ghi chú.

Thư viện/chương/bài dùng state rõ cấp; ghi chú localStorage có button save/error. Practice draft validate khi load/save; quiz deterministic từ15 câu mẫu, không LLM. Download UTF8 text qua Blob; đáp án file riêng. Chat chỉ dùng lesson nằm trong selected sources, label kịch bản rõ, không nhận state/verifier từ client. Các không gian học tập giữ mounted/hidden để bảo toàn state trong lượt dùng; lab không chạy nền khi rời trang.

Kiểm bằng TypeScript/ESLint, build, Vitest và7 E2E: library/notes/exercise→lab; draft reload/quiz/download; Lumi/sources/tree/conversation cùng4 regression Canvas. Review ảnhdesktop1440/mobile390. Backend verifier/save/LLM/RAG giữ task riêng.
