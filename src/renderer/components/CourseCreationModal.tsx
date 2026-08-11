import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  BookOpen,
  Compass,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Wrench,
  Plus,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { generateCourse } from '../services/courseService';
import { getModelById } from '../models';
import { SequentialGenerationVisualizer } from './preview/SequentialGenerationVisualizer';

interface CourseCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCourseCreated: (courseId: string) => void;
  selectedModel: string;
  onOpenAnimationPreview?: () => void;
}

interface TopicCategory {
  id: string;
  name: string;
  courses: Array<{ id: string; title: string; tag?: string }>;
}

const DISCOVERY_CATEGORIES: Record<string, TopicCategory[]> = {
  learn_courses: [
    {
      id: 'system_design',
      name: 'System Design',
      courses: [
        { id: 'sd-1', title: 'Grokking Modern System Design Interview', tag: 'Top Pick' },
        { id: 'sd-2', title: 'Grokking the Mobile System Design Interview' },
        { id: 'sd-3', title: 'Grokking the Generative AI System Design' },
        { id: 'sd-4', title: 'System Design Interview: Fast-Track in 48 Hours' },
        { id: 'sd-5', title: 'Grokking the Machine Learning System Design Interview' },
        { id: 'sd-6', title: 'Grokking the Product Architecture Interview' },
        { id: 'sd-7', title: 'Grokking the Frontend System Design Interview' },
        { id: 'sd-8', title: 'Agentic System Design & Swarms' },
        { id: 'sd-9', title: 'System Design Deep Dive: Real-World Distributed Systems' },
      ],
    },
    {
      id: 'generative_ai',
      name: 'Generative AI',
      courses: [
        { id: 'ai-1', title: 'Full Stack AI Engineering & RAG', tag: 'Top Pick' },
        { id: 'ai-2', title: 'Building Autonomous AI Agents with MCP' },
        { id: 'ai-3', title: 'LLM Fine-Tuning & Vector Databases' },
        { id: 'ai-4', title: 'Prompt Engineering & Structured Outputs' },
      ],
    },
    {
      id: 'programming_languages',
      name: 'Programming Languages',
      courses: [
        { id: 'pl-1', title: 'Learn C++ from Scratch', tag: 'Popular' },
        { id: 'pl-2', title: 'Rust Systems Programming & Concurrency' },
        { id: 'pl-3', title: 'Advanced TypeScript & Design Patterns' },
        { id: 'pl-4', title: 'Python 3 for Data Science & AI' },
        { id: 'pl-5', title: 'Go Programming & High-Performance Microservices' },
      ],
    },
    {
      id: 'web_dev',
      name: 'Web Development',
      courses: [
        { id: 'wd-1', title: 'Full Stack Next.js & React 19 Mastery' },
        { id: 'wd-2', title: 'NestJS Backend Architecture & Microservices' },
        { id: 'wd-3', title: 'Modern CSS, Tailwind & Design Systems' },
      ],
    },
    {
      id: 'machine_learning',
      name: 'Machine Learning',
      courses: [
        { id: 'ml-1', title: 'Deep Learning & Neural Networks with PyTorch' },
        { id: 'ml-2', title: 'Applied Machine Learning for Developers' },
      ],
    },
  ],
  learn_paths: [
    {
      id: 'path_ai_engineer',
      name: 'AI Engineering Path',
      courses: [
        { id: 'p-1', title: 'Zero to Mastery: AI Systems Engineer' },
        { id: 'p-2', title: 'LLM Architect Path' },
      ],
    },
  ],
  practice_projects: [
    {
      id: 'project_labs',
      name: 'Hands-On Projects',
      courses: [
        { id: 'proj-1', title: 'Build a Production AI Coding Assistant' },
        { id: 'proj-2', title: 'Build a Distributed Cache in Rust' },
      ],
    },
  ],
};

export const CourseCreationModal: React.FC<CourseCreationModalProps> = ({
  isOpen,
  onClose,
  onCourseCreated,
  selectedModel,
  onOpenAnimationPreview,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedNavGroup, setSelectedNavGroup] = useState<string>('learn_courses');
  const [activeTopicId, setActiveTopicId] = useState<string>('system_design');
  const [selectedTopicTitle, setSelectedTopicTitle] = useState<string>('');
  const [customTopicInput, setCustomTopicInput] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);

  const [knowledgeLevel, setKnowledgeLevel] = useState<string>('intermediate');
  const [targetGoal, setTargetGoal] = useState<string>('Build a production project');
  const [explanationStyle, setExplanationStyle] = useState<string>('hands_on_lab_first');

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [animPhase, setAnimPhase] = useState<'CONNECTING' | 'GENERATING'>('CONNECTING');

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showCustomInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showCustomInput]);

  if (!isOpen) return null;

  const currentTopicCategory = (DISCOVERY_CATEGORIES[selectedNavGroup] || DISCOVERY_CATEGORIES.learn_courses).find(
    (c) => c.id === activeTopicId
  ) || (DISCOVERY_CATEGORIES[selectedNavGroup] || DISCOVERY_CATEGORIES.learn_courses)[0];

  const handleSelectCourseTemplate = (title: string) => {
    setSelectedTopicTitle(title);
    setErrorMsg(null);
    setStep(2);
  };

  const handleCustomTopicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTopicInput.trim()) return;
    setSelectedTopicTitle(customTopicInput.trim());
    setErrorMsg(null);
    setStep(2);
  };

  const handleStartGeneration = async () => {
    if (!selectedTopicTitle) return;
    setIsGenerating(true);
    setErrorMsg(null);
    setStep(3);

    try {
      const modelObj = getModelById(selectedModel);
      console.log('[CourseModal] Starting course generation with params:', {
        topic: selectedTopicTitle,
        level: knowledgeLevel,
        goal: targetGoal,
        style: explanationStyle,
        modelName: selectedModel,
        providerSlug: modelObj?.providerSlug,
      });

      const course = await generateCourse({
        topic: selectedTopicTitle,
        level: knowledgeLevel,
        goal: targetGoal,
        style: explanationStyle,
        modelName: selectedModel,
        providerSlug: modelObj?.providerSlug,
      });

      console.log('[CourseModal] Course generated successfully:', course);

      setIsGenerating(false);
      onCourseCreated(course.id);
      onClose();
      resetForm();
    } catch (err: unknown) {
      console.error('[CourseModal] Course generation error:', err);
      setIsGenerating(false);
      const msg = err instanceof Error ? err.message : 'Failed to generate course';
      setErrorMsg(msg);
      setStep(2);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedTopicTitle('');
    setCustomTopicInput('');
    setShowCustomInput(false);
    setErrorMsg(null);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="course-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="course-modal-header" style={step === 3 ? { paddingBottom: 0 } : undefined}>
          <div className="modal-title-box">
            {step === 3 ? (
              <div className="subtle-stage-bar" style={{ marginBottom: 0, padding: 0 }}>
                <span className="subtle-stage-text">
                  {animPhase === 'CONNECTING' ? 'AI Agent Thinking & Researching...' : 'Generating Course Lessons...'}
                </span>
              </div>
            ) : step === 2 ? (
              <div>
                <h2 className="modal-heading">Customize Your Learning Experience</h2>
                <p className="modal-subheading">Tailor your knowledge level, target goal, and teaching style for {selectedTopicTitle || 'your course'}</p>
              </div>
            ) : (
              <div>
                <h2 className="modal-heading">What do You Want Gohard to teach you?</h2>
                <p className="modal-subheading">Choose a topic below or enter a custom skill to generate a personalized course</p>
              </div>
            )}
          </div>
          <div className="header-actions-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="course-modal-body">
          {/* STEP 1: Educative.io Clean 3-Column Split */}
          {step === 1 && (
            <div className="discovery-step">
              <div className="discovery-columns">
                {/* Column 1: Clean Navigation Rail */}
                <div className="discovery-rail">
                  <div className="rail-top-sections">
                    <div className="rail-group-label">LEARN</div>
                    <button
                      className={`nav-rail-item ${selectedNavGroup === 'learn_courses' ? 'active' : ''}`}
                      onMouseEnter={() => {
                        setSelectedNavGroup('learn_courses');
                        setActiveTopicId('system_design');
                      }}
                      onClick={() => {
                        setSelectedNavGroup('learn_courses');
                        setActiveTopicId('system_design');
                      }}
                    >
                      <BookOpen size={16} />
                      <span>Courses</span>
                    </button>
                    <button
                      className={`nav-rail-item ${selectedNavGroup === 'learn_paths' ? 'active' : ''}`}
                      onMouseEnter={() => {
                        setSelectedNavGroup('learn_paths');
                        setActiveTopicId('path_ai_engineer');
                      }}
                      onClick={() => {
                        setSelectedNavGroup('learn_paths');
                        setActiveTopicId('path_ai_engineer');
                      }}
                    >
                      <Compass size={16} />
                      <span>Paths</span>
                    </button>

                    <div className="rail-group-label mt-4">PRACTICE</div>
                    <button
                      className={`nav-rail-item ${selectedNavGroup === 'practice_projects' ? 'active' : ''}`}
                      onMouseEnter={() => {
                        setSelectedNavGroup('practice_projects');
                        setActiveTopicId('project_labs');
                      }}
                      onClick={() => {
                        setSelectedNavGroup('practice_projects');
                        setActiveTopicId('project_labs');
                      }}
                    >
                      <Wrench size={16} />
                      <span>Projects</span>
                    </button>
                  </div>

                  {/* + Custom Skill Button anchored at bottom of Column 1 */}
                  <div className="custom-skill-btn-box">
                    <button
                      className={`custom-skill-rail-btn ${showCustomInput ? 'active' : ''}`}
                      onMouseEnter={() => setShowCustomInput(true)}
                      onClick={() => setShowCustomInput((prev) => !prev)}
                    >
                      <Plus size={16} />
                      <span>Custom Skill</span>
                    </button>
                  </div>
                </div>

                {/* Column 2: Topics */}
                <div className="discovery-topics">
                  <div className="column-title">TOPICS</div>
                  <div className="topics-list">
                    {(DISCOVERY_CATEGORIES[selectedNavGroup] || DISCOVERY_CATEGORIES.learn_courses).map((cat) => (
                      <button
                        key={cat.id}
                        className={`topic-btn ${activeTopicId === cat.id ? 'active' : ''}`}
                        onMouseEnter={() => setActiveTopicId(cat.id)}
                        onClick={() => setActiveTopicId(cat.id)}
                      >
                        <span>{cat.name}</span>
                        <ChevronRight size={15} className="chevron" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Column 3: Full Height Suggested Courses */}
                <div className="discovery-courses">
                  <div className="column-title">SUGGESTED COURSES</div>
                  <div className="starters-list">
                    {currentTopicCategory.courses.map((course) => (
                      <div
                        key={course.id}
                        className="starter-row"
                        onClick={() => handleSelectCourseTemplate(course.title)}
                      >
                        <div className="starter-title-row">
                          <BookOpen size={16} className="starter-icon" />
                          <span className="starter-title">{course.title}</span>
                        </div>
                        {course.tag && <span className="starter-tag">{course.tag}</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating Input Bar Overlay across Column 2 & 3 on exact same line as + Custom Skill button */}
                {showCustomInput && (
                  <form
                    className="custom-floating-line-input animate-flyout"
                    onSubmit={handleCustomTopicSubmit}
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      className="custom-topic-input"
                      placeholder="Type any custom topic you want Gohard to teach you..."
                      value={customTopicInput}
                      onChange={(e) => setCustomTopicInput(e.target.value)}
                    />
                    <button type="submit" className="custom-submit-btn" disabled={!customTopicInput.trim()}>
                      <span>Continue</span>
                      <ArrowRight size={14} />
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Questionnaire */}
          {step === 2 && (
            <div className="questionnaire-step">
              <div className="selected-topic-header">
                <button className="back-link-btn" onClick={() => setStep(1)}>
                  <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
                  <span>Back</span>
                </button>
                <h3 className="selected-title">{selectedTopicTitle}</h3>
              </div>

              {errorMsg && <div className="modal-error-alert">{errorMsg}</div>}

              <div className="question-group">
                <label className="question-label">1. What is your current knowledge level?</label>
                <div className="option-grid">
                  {[
                    { id: 'beginner', title: 'Beginner', desc: 'Starting from fundamental concepts' },
                    { id: 'intermediate', title: 'Intermediate', desc: 'Familiar with core syntax and concepts' },
                    { id: 'advanced', title: 'Advanced', desc: 'Looking for deep architectural mastery' },
                  ].map((level) => (
                    <div
                      key={level.id}
                      className={`option-card ${knowledgeLevel === level.id ? 'active' : ''}`}
                      onClick={() => setKnowledgeLevel(level.id)}
                    >
                      <div className="option-header">
                        <span className="option-title">{level.title}</span>
                        {knowledgeLevel === level.id && <CheckCircle2 size={16} className="check-icon" />}
                      </div>
                      <span className="option-desc">{level.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="question-group">
                <label className="question-label">2. What is your primary learning goal?</label>
                <input
                  type="text"
                  className="modal-text-input"
                  value={targetGoal}
                  onChange={(e) => setTargetGoal(e.target.value)}
                  placeholder="e.g. Build a production app, Pass technical interviews..."
                />
              </div>

              <div className="question-group">
                <label className="question-label">3. Preferred explanation style</label>
                <div className="option-grid">
                  {[
                    { id: 'hands_on_lab_first', title: 'Code-First & Labs', desc: 'Learn by writing code and examples' },
                    { id: 'analogy_driven', title: 'Analogy-Driven', desc: 'Relate concepts to real-world analogies' },
                    { id: 'visual_diagrams', title: 'Visual Diagrams', desc: 'Architecture flows & Mermaid diagrams' },
                    { id: 'first_principles', title: 'First Principles', desc: 'Deep dive into theoretical mechanics' },
                  ].map((style) => (
                    <div
                      key={style.id}
                      className={`option-card ${explanationStyle === style.id ? 'active' : ''}`}
                      onClick={() => setExplanationStyle(style.id)}
                    >
                      <div className="option-header">
                        <span className="option-title">{style.title}</span>
                        {explanationStyle === style.id && <CheckCircle2 size={16} className="check-icon" />}
                      </div>
                      <span className="option-desc">{style.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer-actions">
                <button className="primary-btn" onClick={handleStartGeneration}>
                  <span>Generate My Course</span>
                  <ArrowRight size={17} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Generation Loading State */}
          {step === 3 && (
            <div className="generating-step" style={{ padding: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <SequentialGenerationVisualizer topicTitle={selectedTopicTitle} onPhaseChange={setAnimPhase} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCreationModal;
