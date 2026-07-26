import React, { useState, useEffect, useRef, Component } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Smile,
  BookOpen,
  Sun,
  GraduationCap,
  MapPin,
  Calendar,
  Users,
  Compass,
  Search,
  Plus,
  Trash2,
  Copy,
  Check,
  Edit2,
  ArrowLeft,
  ArrowRight,
  Home,
  LayoutGrid,
  RefreshCw,
  Moon,
  X,
  ChevronRight,
  ChevronDown,
  Info,
  Menu,
  FileText,
  Bookmark,
  Share2,
  AlertCircle,
  Eye,
  PlusCircle,
  HelpCircle,
  Type,
  Maximize2,
  Minimize2,
  Palette,
  EyeOff,
  GripVertical
} from "lucide-react";
import { Category, SubBranch, TextItem } from "./types";
import { INITIAL_CATEGORIES } from "./data";
import fadaelLogo from "./assets/images/fadael_logo_1783001240321.jpg";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

// --- Helper for Safe Storage Operations (prevents iframe SecurityError) ---
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Storage access blocked or unavailable
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Storage access blocked or quota exceeded
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Storage access blocked or unavailable
    }
  }
};

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare props: ErrorBoundaryProps;
  declare state: ErrorBoundaryState;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  componentDidMount() {
    window.addEventListener("unhandledrejection", this.handleUnhandledRejection);
    window.addEventListener("error", this.handleWindowError);
  }

  componentWillUnmount() {
    window.removeEventListener("unhandledrejection", this.handleUnhandledRejection);
    window.removeEventListener("error", this.handleWindowError);
  }

  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    console.warn("Handled unhandled rejection gracefully:", event.reason);
    if (event) {
      event.preventDefault();
    }
  };

  handleWindowError = (event: ErrorEvent) => {
    console.warn("Handled window error gracefully:", event.message);
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center font-sans" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md shadow-2xl space-y-4">
            <h2 className="text-xl font-bold text-amber-400 font-display">حدث خطأ غير متوقع</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              تم رصد مشكلة أثناء التشغيل. يمكنك إعادة تحميل التطبيق وتنسيق البيانات بأمان.
            </p>
            <button
              onClick={() => {
                safeStorage.removeItem("fadail_categories_v40");
                window.location.reload();
              }}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
            >
              استعادة البيانات الافتراضية وإعادة التحميل
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
  // --- States ---
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = safeStorage.getItem("fadail_categories_v40");
      if (saved) {
        const parsed = JSON.parse(saved) as Category[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const freshCategories = JSON.parse(JSON.stringify(INITIAL_CATEGORIES)) as Category[];
          freshCategories.forEach((initCat) => {
            const parsedCat = parsed.find((c) => c && c.id === initCat.id);
            if (parsedCat) {
              parsedCat.name = initCat.name;
              const existingSubs = Array.isArray(parsedCat.subBranches) ? parsedCat.subBranches : [];
              const orderedSubs = (initCat.subBranches || []).map((initSub) => {
                const parsedSub = existingSubs.find((ps) => ps && ps.id === initSub.id);
                if (parsedSub) {
                  parsedSub.items = initSub.items;
                  return parsedSub;
                }
                return initSub;
              });
              const customSubs = existingSubs.filter(
                (ps) => ps && typeof ps.id === "string" && ps.id.startsWith("sub-") && !(initCat.subBranches || []).some((is) => is.id === ps.id)
              );
              parsedCat.subBranches = [...orderedSubs, ...customSubs];
            } else {
              parsed.push(initCat);
            }
          });
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error parsing categories from local storage:", e);
    }
    return INITIAL_CATEGORIES;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"home" | "explorer">("home");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
  // Navigation states
  const [activeCategoryId, setActiveCategoryId] = useState<string>("worship");
  const [activeSubBranchId, setActiveSubBranchId] = useState<string>("worship-sub6");
  
  // Orbit view interactive preview state
  const [selectedOrbitCategoryId, setSelectedOrbitCategoryId] = useState<string | null>("worship");

  // Input states for adding Categories
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("Sparkles");
  const [newCategoryColor, setNewCategoryColor] = useState("emerald");
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);

  // Input states for adding Sub-branches
  const [newSubBranchName, setNewSubBranchName] = useState("");
  const [showAddSubBranchForm, setShowAddSubBranchForm] = useState(false);
  const [isSubBranchDropdownOpen, setIsSubBranchDropdownOpen] = useState(false);

  // Input states for adding Texts
  const [newTextContent, setNewTextContent] = useState("");
  const [newTextSource, setNewTextSource] = useState("");
  const [newTextTags, setNewTextTags] = useState("");
  const [showAddTextForm, setShowAddTextForm] = useState(false);

  // Text Editing state
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextContent, setEditingTextContent] = useState("");
  const [editingTextSource, setEditingTextSource] = useState("");
  const [editingTextTags, setEditingTextTags] = useState("");

  // UI feedback states
  const [copiedTextId, setCopiedTextId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Custom Delete Confirm Dialog state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "category" | "subBranch";
    id: string;
    name: string;
  } | null>(null);

  // --- Text Formatting Services States ---
  const [activeFont, setActiveFont] = useState<"font-tajawal" | "font-cairo" | "font-amiri" | "font-lateef" | "font-mohanad">("font-tajawal");
  const [textSize, setTextSize] = useState<number>(12);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [textBgStyle, setTextBgStyle] = useState<"default" | "cream" | "dark" | "mint">("default");
  const [isWithoutHarakat, setIsWithoutHarakat] = useState<boolean>(false);

  // --- Helper to strip Arabic diacritics/Harakat ---
  const stripDiacritics = (text: string) => {
    return text.replace(/[\u064B-\u0652\u0640]/g, "");
  };

  // --- Effects ---
  useEffect(() => {
    safeStorage.setItem("fadail_categories_v40", JSON.stringify(categories));
  }, [categories]);

  // Handle auto-selection of sub-branch when active category changes
  useEffect(() => {
    const category = (categories || []).find((c) => c && c.id === activeCategoryId);
    if (category && Array.isArray(category.subBranches) && category.subBranches.length > 0) {
      // Find if active sub-branch is part of this category
      const exists = category.subBranches.some((s) => s && s.id === activeSubBranchId);
      if (!exists) {
        setActiveSubBranchId(category.subBranches[0].id);
      }
    } else {
      setActiveSubBranchId("");
    }
  }, [activeCategoryId, categories, activeSubBranchId]);

  // --- Utility functions ---
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const copyToClipboard = (text: string, itemId: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          setCopiedTextId(itemId);
          triggerToast("تم نسخ النص بنجاح إلى الحافظة!");
          setTimeout(() => {
            setCopiedTextId(null);
          }, 2000);
        }).catch(() => {
          // Fallback if writeText promise fails
          fallbackCopyToClipboard(text, itemId);
        });
      } else {
        fallbackCopyToClipboard(text, itemId);
      }
    } catch (e) {
      fallbackCopyToClipboard(text, itemId);
    }
  };

  const fallbackCopyToClipboard = (text: string, itemId: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (success) {
        setCopiedTextId(itemId);
        triggerToast("تم نسخ النص بنجاح إلى الحافظة!");
        setTimeout(() => {
          setCopiedTextId(null);
        }, 2000);
      } else {
        triggerToast("عذرًا، فشل نسخ النص.");
      }
    } catch (err) {
      triggerToast("عذرًا، فشل نسخ النص.");
    }
  };

  const handleShare = (text: string, source: string) => {
    const shareText = `«${text}»\nالمصدر: ${source || "غير محدد"}\n#فضائل_الأعمال`;
    
    const fallbackCopy = () => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(shareText).then(() => {
            triggerToast("تم نسخ نص المشاركة بنجاح!");
          }).catch(() => {
            fallbackShareCopy(shareText);
          });
        } else {
          fallbackShareCopy(shareText);
        }
      } catch (e) {
        fallbackShareCopy(shareText);
      }
    };

    const fallbackShareCopy = (txt: string) => {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = txt;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (success) {
          triggerToast("تم نسخ نص المشاركة بنجاح!");
        } else {
          triggerToast("عذرًا، فشل نسخ نص المشاركة.");
        }
      } catch (err) {
        triggerToast("عذرًا، فشل نسخ نص المشاركة.");
      }
    };

    if (navigator.share) {
      try {
        navigator.share({
          title: 'فضائل الأعمال',
          text: shareText,
        })
        .then(() => {
          triggerToast("تمت المشاركة بنجاح!");
        })
        .catch(() => {
          // If rejected or cancelled, use fallback copy
          fallbackCopy();
        });
      } catch (e) {
        // If navigator.share throws a synchronous error (common in sandboxed iframe)
        fallbackCopy();
      }
    } else {
      fallbackCopy();
    }
  };

  const resetToDefault = () => {
    if (window.confirm("هل أنت متأكد من رغبتك في إعادة تعيين كافة الأقسام والنصوص إلى الإعدادات الافتراضية؟")) {
      setCategories(INITIAL_CATEGORIES);
      setActiveCategoryId("worship");
      setActiveSubBranchId("worship-sub4");
      setSelectedOrbitCategoryId("worship");
      triggerToast("تمت إعادة تعيين البيانات بنجاح.");
    }
  };

  // --- CRUD Operations ---
  
  // Add main category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    const id = "cat-" + Date.now();
    const newCat: Category = {
      id,
      name: newCategoryName.trim(),
      icon: newCategoryIcon,
      color: newCategoryColor,
      subBranches: []
    };

    setCategories([...categories, newCat]);
    setNewCategoryName("");
    setShowAddCategoryForm(false);
    setActiveCategoryId(id);
    triggerToast(`تمت إضافة القسم الرئيسي "${newCat.name}" بنجاح!`);
  };

  // Delete main category
  const handleDeleteCategory = (catId: string, name: string) => {
    setDeleteConfirm({ type: "category", id: catId, name });
  };

  // Add sub-branch
  const handleAddSubBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubBranchName.trim() || !activeCategoryId) return;

    const subId = "sub-" + Date.now();
    const newSub: SubBranch = {
      id: subId,
      name: newSubBranchName.trim(),
      items: []
    };

    const updated = categories.map((cat) => {
      if (cat.id === activeCategoryId) {
        return {
          ...cat,
          subBranches: [...cat.subBranches, newSub]
        };
      }
      return cat;
    });

    setCategories(updated);
    setActiveSubBranchId(subId);
    setNewSubBranchName("");
    triggerToast(`تمت إضافة التفريع "${newSub.name}" بنجاح!`);
  };

  // Delete sub-branch
  const handleDeleteSubBranch = (subId: string, name: string) => {
    setDeleteConfirm({ type: "subBranch", id: subId, name });
  };

  // Execute actual deletion from custom modal
  const executeDelete = () => {
    if (!deleteConfirm) return;
    const { type, id, name } = deleteConfirm;

    if (type === "category") {
      const updated = categories.filter((c) => c.id !== id);
      setCategories(updated);
      if (activeCategoryId === id && updated.length > 0) {
        setActiveCategoryId(updated[0].id);
        if (updated[0].subBranches.length > 0) {
          setActiveSubBranchId(updated[0].subBranches[0].id);
        } else {
          setActiveSubBranchId("");
        }
      }
      if (selectedOrbitCategoryId === id) {
        setSelectedOrbitCategoryId(updated.length > 0 ? updated[0].id : null);
      }
      triggerToast(`تم حذف القسم "${name}" بنجاح.`);
    } else if (type === "subBranch") {
      const updated = categories.map((cat) => {
        if (cat.id === activeCategoryId) {
          return {
            ...cat,
            subBranches: cat.subBranches.filter((s) => s.id !== id)
          };
        }
        return cat;
      });
      setCategories(updated);
      if (activeSubBranchId === id) {
        const cat = categories.find((c) => c.id === activeCategoryId);
        const remainingSubs = cat?.subBranches.filter((s) => s.id !== id) || [];
        if (remainingSubs.length > 0) {
          setActiveSubBranchId(remainingSubs[0].id);
        } else {
          setActiveSubBranchId("");
        }
      }
      triggerToast(`تم حذف التفريع "${name}" بنجاح.`);
    }

    setDeleteConfirm(null);
  };



  // Add text item to sub-branch
  const handleAddText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTextContent.trim() || !activeCategoryId) return;

    // Fallback to first sub-branch if none active
    const targetSubBranchId = activeSubBranchId || (selectedCategory?.subBranches[0]?.id);
    if (!targetSubBranchId) {
      triggerToast("يرجى إضافة تفريع فرعي أولاً!");
      return;
    }

    const textId = "text-" + Date.now();
    const tagsArray = newTextTags
      ? newTextTags.split(",").map((t) => t.trim()).filter((t) => t.length > 0)
      : [];

    const newItem: TextItem = {
      id: textId,
      content: newTextContent.trim(),
      source: newTextSource.trim() || undefined,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
      createdAt: new Date().toISOString()
    };

    const updated = categories.map((cat) => {
      if (cat.id === activeCategoryId) {
        return {
          ...cat,
          subBranches: cat.subBranches.map((sub) => {
            if (sub.id === targetSubBranchId) {
              return {
                ...sub,
                items: [newItem, ...sub.items] // Prepend new texts
              };
            }
            return sub;
          })
        };
      }
      return cat;
    });

    setCategories(updated);
    setNewTextContent("");
    setNewTextSource("");
    setNewTextTags("");
    setShowAddTextForm(false);
    triggerToast("تم إدراج النص الجديد بنجاح!");
  };

  // Start editing a text item
  const startEditText = (item: TextItem) => {
    setEditingTextId(item.id);
    setEditingTextContent(item.content);
    setEditingTextSource(item.source || "");
    setEditingTextTags(item.tags ? item.tags.join(", ") : "");
  };

  // Save edited text
  const handleSaveEditedText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTextId || !editingTextContent.trim()) return;

    const tagsArray = editingTextTags
      ? editingTextTags.split(",").map((t) => t.trim()).filter((t) => t.length > 0)
      : [];

    const updated = categories.map((cat) => {
      if (cat.id === activeCategoryId) {
        return {
          ...cat,
          subBranches: cat.subBranches.map((sub) => {
            return {
              ...sub,
              items: sub.items.map((item) => {
                if (item.id === editingTextId) {
                  return {
                    ...item,
                    content: editingTextContent.trim(),
                    source: editingTextSource.trim() || undefined,
                    tags: tagsArray.length > 0 ? tagsArray : undefined
                  };
                }
                return item;
              })
            };
          })
        };
      }
      return cat;
    });

    setCategories(updated);
    setEditingTextId(null);
    triggerToast("تم تعديل النص بنجاح!");
  };

  // Delete text item
  const handleDeleteText = (textId: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا النص بشكل نهائي؟")) {
      const updated = categories.map((cat) => {
        if (cat.id === activeCategoryId) {
          return {
            ...cat,
            subBranches: cat.subBranches.map((sub) => {
              return {
                ...sub,
                items: sub.items.filter((item) => item.id !== textId)
              };
            })
          };
        }
        return cat;
      });
      setCategories(updated);
      triggerToast("تم حذف النص.");
    }
  };

  // --- Search results compilation ---
  const getSearchResults = () => {
    if (!searchQuery.trim()) return [];

    const results: {
      category: Category;
      subBranch: SubBranch;
      item: TextItem;
    }[] = [];

    const query = searchQuery.toLowerCase().trim();

    (categories || []).forEach((cat) => {
      if (!cat) return;
      (cat.subBranches || []).forEach((sub) => {
        if (!sub) return;
        (sub.items || []).forEach((item) => {
          if (!item) return;
          const content = (item.content || "").toLowerCase();
          const source = (item.source || "").toLowerCase();
          const tags = Array.isArray(item.tags) ? item.tags : [];
          const subName = (sub.name || "").toLowerCase();
          const catName = (cat.name || "").toLowerCase();

          const inContent = content.includes(query);
          const inSource = source.includes(query);
          const inTags = tags.some((t) => t && typeof t === "string" && t.toLowerCase().includes(query));
          const inSubName = subName.includes(query);
          const inCatName = catName.includes(query);

          if (inContent || inSource || inTags || inSubName || inCatName) {
            results.push({
              category: cat,
              subBranch: sub,
              item
            });
          }
        });
      });
    });

    return results;
  };

  const searchResults = getSearchResults();

  // --- Dynamic Gradient Backgrounds for Categories ---
  const getCategoryGradient = (color: string | undefined, isDark: boolean) => {
    if (isDark) {
      switch (color) {
        case "blue":
        case "indigo":
          return "bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/50 border-slate-800 border-r-blue-500 shadow-lg shadow-blue-950/20";
        case "emerald":
          return "bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/50 border-slate-800 border-r-emerald-500 shadow-lg shadow-emerald-950/20";
        case "amber":
        case "orange":
          return "bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/50 border-slate-800 border-r-amber-500 shadow-lg shadow-amber-950/20";
        case "violet":
        case "pink":
          return "bg-gradient-to-br from-slate-900 via-slate-900 to-violet-950/50 border-slate-800 border-r-violet-500 shadow-lg shadow-violet-950/20";
        case "cyan":
        case "sky":
        case "teal":
          return "bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/50 border-slate-800 border-r-cyan-500 shadow-lg shadow-cyan-950/20";
        default:
          return "bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/50 border-slate-800 border-r-blue-500 shadow-lg shadow-blue-950/20";
      }
    } else {
      switch (color) {
        case "blue":
        case "indigo":
          return "bg-gradient-to-br from-blue-50/90 via-indigo-50/50 to-sky-50/70 border-slate-200 border-r-blue-500 shadow-sm";
        case "emerald":
          return "bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-slate-50/70 border-slate-200 border-r-emerald-500 shadow-sm";
        case "amber":
        case "orange":
          return "bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-yellow-50/70 border-slate-200 border-r-amber-500 shadow-sm";
        case "violet":
        case "pink":
          return "bg-gradient-to-br from-violet-50/90 via-fuchsia-50/50 to-pink-50/70 border-slate-200 border-r-violet-500 shadow-sm";
        case "cyan":
        case "sky":
        case "teal":
          return "bg-gradient-to-br from-cyan-50/90 via-sky-50/50 to-teal-50/70 border-slate-200 border-r-cyan-500 shadow-sm";
        default:
          return "bg-gradient-to-br from-slate-50/90 via-blue-50/40 to-slate-100/70 border-slate-200 border-r-blue-500 shadow-sm";
      }
    }
  };

  // --- Theme Colors Helper ---
  const getThemeColors = (color: string) => {
    const isDark = isDarkMode;
    const themes: Record<string, {
      catActive: string;
      catDotActive: string;
      catDotInactive: string;
      subActive: string;
      subDotActive: string;
      subDotInactive: string;
      subHover: string;
    }> = {
      blue: {
        catActive: isDark ? "bg-blue-900/40 border-blue-500 text-blue-200" : "bg-blue-50 border-blue-200 text-blue-800",
        catDotActive: "bg-blue-400",
        catDotInactive: "bg-blue-400/50",
        subActive: isDark ? "bg-blue-600 border-blue-500 text-white" : "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200",
        subDotActive: "bg-white",
        subDotInactive: "bg-blue-500",
        subHover: isDark ? "hover:bg-blue-950/20 hover:border-blue-900 text-slate-300 hover:text-blue-300" : "hover:bg-blue-50/70 hover:border-blue-200 text-slate-600 hover:text-blue-800"
      },
      emerald: {
        catActive: isDark ? "bg-emerald-900/40 border-emerald-500 text-emerald-200" : "bg-emerald-50 border-emerald-200 text-emerald-800",
        catDotActive: "bg-emerald-400",
        catDotInactive: "bg-emerald-400/50",
        subActive: isDark ? "bg-emerald-600 border-emerald-500 text-white" : "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-200",
        subDotActive: "bg-white",
        subDotInactive: "bg-emerald-500",
        subHover: isDark ? "hover:bg-emerald-950/20 hover:border-emerald-900 text-slate-300 hover:text-emerald-300" : "hover:bg-emerald-50/70 hover:border-emerald-200 text-slate-600 hover:text-emerald-800"
      },
      amber: {
        catActive: isDark ? "bg-amber-900/40 border-amber-500 text-amber-200" : "bg-amber-50 border-amber-200 text-amber-800",
        catDotActive: "bg-amber-400",
        catDotInactive: "bg-amber-400/50",
        subActive: isDark ? "bg-amber-600 border-amber-500 text-white" : "bg-amber-600 text-white border-amber-600 shadow-sm shadow-amber-200",
        subDotActive: "bg-white",
        subDotInactive: "bg-amber-500",
        subHover: isDark ? "hover:bg-amber-950/20 hover:border-amber-900 text-slate-300 hover:text-amber-300" : "hover:bg-amber-50/70 hover:border-amber-200 text-slate-600 hover:text-amber-800"
      },
      indigo: {
        catActive: isDark ? "bg-indigo-900/40 border-indigo-500 text-indigo-200" : "bg-indigo-50 border-indigo-200 text-indigo-800",
        catDotActive: "bg-indigo-400",
        catDotInactive: "bg-indigo-400/50",
        subActive: isDark ? "bg-indigo-600 border-indigo-500 text-white" : "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200",
        subDotActive: "bg-white",
        subDotInactive: "bg-indigo-500",
        subHover: isDark ? "hover:bg-indigo-950/20 hover:border-indigo-900 text-slate-300 hover:text-indigo-300" : "hover:bg-indigo-50/70 hover:border-indigo-200 text-slate-600 hover:text-indigo-800"
      },
      violet: {
        catActive: isDark ? "bg-violet-900/40 border-violet-500 text-violet-200" : "bg-violet-50 border-violet-200 text-violet-800",
        catDotActive: "bg-violet-400",
        catDotInactive: "bg-violet-400/50",
        subActive: isDark ? "bg-violet-600 border-violet-500 text-white" : "bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-200",
        subDotActive: "bg-white",
        subDotInactive: "bg-violet-500",
        subHover: isDark ? "hover:bg-violet-950/20 hover:border-violet-900 text-slate-300 hover:text-violet-300" : "hover:bg-violet-50/70 hover:border-violet-200 text-slate-600 hover:text-violet-800"
      },
      teal: {
        catActive: isDark ? "bg-teal-900/40 border-teal-500 text-teal-200" : "bg-teal-50 border-teal-200 text-teal-800",
        catDotActive: "bg-teal-400",
        catDotInactive: "bg-teal-400/50",
        subActive: isDark ? "bg-teal-600 border-teal-500 text-white" : "bg-teal-600 text-white border-teal-600 shadow-sm shadow-teal-200",
        subDotActive: "bg-white",
        subDotInactive: "bg-teal-500",
        subHover: isDark ? "hover:bg-teal-950/20 hover:border-teal-900 text-slate-300 hover:text-teal-300" : "hover:bg-teal-50/70 hover:border-teal-200 text-slate-600 hover:text-teal-800"
      },
      cyan: {
        catActive: isDark ? "bg-cyan-900/40 border-cyan-500 text-cyan-200" : "bg-cyan-50 border-cyan-200 text-cyan-800",
        catDotActive: "bg-cyan-400",
        catDotInactive: "bg-cyan-400/50",
        subActive: isDark ? "bg-cyan-600 border-cyan-500 text-white" : "bg-cyan-600 text-white border-cyan-600 shadow-sm shadow-cyan-200",
        subDotActive: "bg-white",
        subDotInactive: "bg-cyan-500",
        subHover: isDark ? "hover:bg-cyan-950/20 hover:border-cyan-900 text-slate-300 hover:text-cyan-300" : "hover:bg-cyan-50/70 hover:border-cyan-200 text-slate-600 hover:text-cyan-800"
      },
      orange: {
        catActive: isDark ? "bg-orange-900/40 border-orange-500 text-orange-200" : "bg-orange-50 border-orange-200 text-orange-800",
        catDotActive: "bg-orange-400",
        catDotInactive: "bg-orange-400/50",
        subActive: isDark ? "bg-orange-600 border-orange-500 text-white" : "bg-orange-600 text-white border-orange-600 shadow-sm shadow-orange-200",
        subDotActive: "bg-white",
        subDotInactive: "bg-orange-500",
        subHover: isDark ? "hover:bg-orange-950/20 hover:border-orange-900 text-slate-300 hover:text-orange-300" : "hover:bg-orange-50/70 hover:border-orange-200 text-slate-600 hover:text-orange-800"
      },
      pink: {
        catActive: isDark ? "bg-pink-900/40 border-pink-500 text-pink-200" : "bg-pink-50 border-pink-200 text-pink-800",
        catDotActive: "bg-pink-400",
        catDotInactive: "bg-pink-400/50",
        subActive: isDark ? "bg-pink-600 border-pink-500 text-white" : "bg-pink-600 text-white border-pink-600 shadow-sm shadow-pink-200",
        subDotActive: "bg-white",
        subDotInactive: "bg-pink-500",
        subHover: isDark ? "hover:bg-pink-950/20 hover:border-pink-900 text-slate-300 hover:text-pink-300" : "hover:bg-pink-50/70 hover:border-pink-200 text-slate-600 hover:text-pink-800"
      },
      sky: {
        catActive: isDark ? "bg-sky-900/40 border-sky-500 text-sky-200" : "bg-sky-50 border-sky-200 text-sky-800",
        catDotActive: "bg-sky-400",
        catDotInactive: "bg-sky-400/50",
        subActive: isDark ? "bg-sky-600 border-sky-500 text-white" : "bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-200",
        subDotActive: "bg-white",
        subDotInactive: "bg-sky-500",
        subHover: isDark ? "hover:bg-sky-950/20 hover:border-sky-900 text-slate-300 hover:text-sky-300" : "hover:bg-sky-50/70 hover:border-sky-200 text-slate-600 hover:text-sky-800"
      }
    };
    return themes[color] || themes.blue;
  };

  // --- Dynamic Color Styles Mapper ---
  const getColorClasses = (color: string) => {
    const maps: Record<string, {
      bg: string;
      text: string;
      border: string;
      hover: string;
      ring: string;
      pill: string;
      badgeBg: string;
      accentBg: string;
      glow: string;
    }> = {
      emerald: {
        bg: "bg-slate-100/90",
        text: "text-slate-800",
        border: "border-slate-300",
        hover: "hover:bg-slate-200/90",
        ring: "focus:ring-slate-500",
        pill: "bg-slate-600 text-white",
        badgeBg: "bg-slate-200 text-slate-800",
        accentBg: "bg-slate-600/10",
        glow: "shadow-slate-100"
      },
      violet: {
        bg: "bg-violet-50/70",
        text: "text-violet-800",
        border: "border-violet-200",
        hover: "hover:bg-violet-100/70",
        ring: "focus:ring-violet-500",
        pill: "bg-violet-500 text-white",
        badgeBg: "bg-violet-100 text-violet-800",
        accentBg: "bg-violet-500/10",
        glow: "shadow-violet-100"
      },
      cyan: {
        bg: "bg-cyan-50/70",
        text: "text-cyan-800",
        border: "border-cyan-200",
        hover: "hover:bg-cyan-100/70",
        ring: "focus:ring-cyan-500",
        pill: "bg-cyan-500 text-white",
        badgeBg: "bg-cyan-100 text-cyan-800",
        accentBg: "bg-cyan-500/10",
        glow: "shadow-cyan-100"
      },
      amber: {
        bg: "bg-slate-100/90",
        text: "text-slate-700",
        border: "border-slate-200",
        hover: "hover:bg-slate-200/90",
        ring: "focus:ring-slate-400",
        pill: "bg-slate-500 text-white",
        badgeBg: "bg-slate-100 text-slate-700",
        accentBg: "bg-slate-500/10",
        glow: "shadow-slate-100"
      },
      sky: {
        bg: "bg-sky-50/70",
        text: "text-sky-800",
        border: "border-sky-200",
        hover: "hover:bg-sky-100/70",
        ring: "focus:ring-sky-500",
        pill: "bg-sky-500 text-white",
        badgeBg: "bg-sky-100 text-sky-800",
        accentBg: "bg-sky-500/10",
        glow: "shadow-sky-100"
      },
      teal: {
        bg: "bg-zinc-100/90",
        text: "text-zinc-800",
        border: "border-zinc-300",
        hover: "hover:bg-zinc-200/90",
        ring: "focus:ring-zinc-500",
        pill: "bg-zinc-600 text-white",
        badgeBg: "bg-zinc-200 text-zinc-800",
        accentBg: "bg-zinc-600/10",
        glow: "shadow-zinc-100"
      },
      pink: {
        bg: "bg-pink-50/70",
        text: "text-pink-800",
        border: "border-pink-200",
        hover: "hover:bg-pink-100/70",
        ring: "focus:ring-pink-500",
        pill: "bg-pink-500 text-white",
        badgeBg: "bg-pink-100 text-pink-800",
        accentBg: "bg-pink-500/10",
        glow: "shadow-pink-100"
      },
      indigo: {
        bg: "bg-blue-50/70",
        text: "text-blue-800",
        border: "border-blue-200",
        hover: "hover:bg-blue-100/70",
        ring: "focus:ring-blue-500",
        pill: "bg-blue-600 text-white",
        badgeBg: "bg-blue-100 text-blue-800",
        accentBg: "bg-blue-500/10",
        glow: "shadow-blue-100"
      },
      blue: {
        bg: "bg-blue-50/70",
        text: "text-blue-800",
        border: "border-blue-200",
        hover: "hover:bg-blue-100/70",
        ring: "focus:ring-blue-500",
        pill: "bg-blue-600 text-white",
        badgeBg: "bg-blue-100 text-blue-800",
        accentBg: "bg-blue-500/10",
        glow: "shadow-blue-100"
      },
      orange: {
        bg: "bg-orange-50/70",
        text: "text-orange-800",
        border: "border-orange-200",
        hover: "hover:bg-orange-100/70",
        ring: "focus:ring-orange-500",
        pill: "bg-orange-500 text-white",
        badgeBg: "bg-orange-100 text-orange-800",
        accentBg: "bg-orange-500/10",
        glow: "shadow-orange-100"
      }
    };

    return maps[color] || maps.emerald;
  };

  // --- Dynamic Icon Renderer ---
  const renderIcon = (iconName: string, className = "w-5 h-5") => {
    switch (iconName) {
      case "Sparkles": return <Sparkles className={className} />;
      case "Smile": return <Smile className={className} />;
      case "BookOpen": return <BookOpen className={className} />;
      case "Sun": return <Sun className={className} />;
      case "GraduationCap": return <GraduationCap className={className} />;
      case "MapPin": return <MapPin className={className} />;
      case "Calendar": return <Calendar className={className} />;
      case "Users": return <Users className={className} />;
      case "Compass": return <Compass className={className} />;
      default: return <Sparkles className={className} />;
    }
  };

  // Predefined lists of beautiful icons and colors for new categories
  const AVAILABLE_ICONS = ["Sparkles", "Smile", "BookOpen", "Sun", "GraduationCap", "MapPin", "Calendar", "Users", "Compass"];
  const AVAILABLE_COLORS = ["emerald", "violet", "cyan", "amber", "sky", "teal", "pink", "indigo", "orange"];

  // Selected Category references
  const selectedCategory = (categories || []).find((c) => c && c.id === activeCategoryId) || categories[0];
  const selectedSubBranch = selectedCategory?.subBranches && Array.isArray(selectedCategory.subBranches)
    ? (selectedCategory.subBranches.find((s) => s && s.id === activeSubBranchId) || selectedCategory.subBranches[0])
    : undefined;

  // Selected Category in home orbit preview
  const previewOrbitCategory = categories.find((c) => c.id === selectedOrbitCategoryId);

  return (
    <div className={`min-h-screen flex flex-col antialiased font-sans transition-colors duration-300 ${
      isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    }`}>
      
      {/* --- Top Global Header --- */}
      <header className={`sticky top-0 z-40 border-b transition-colors duration-300 px-4 sm:px-8 py-3.5 ${
        isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/80 shadow-xs"
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Right Part: App Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-blue-100 shrink-0 select-none">
              ف
            </div>
            <div>
              <h1 id="app-title" className={`text-2xl font-black tracking-tight font-display transition-colors ${
                isDarkMode ? "text-blue-400" : "text-blue-600"
              }`}>
                فضائل
              </h1>
            </div>
          </div>



          {/* Left Part: Night Mode Toggle */}
          <div className="flex items-center">
            <button
              onClick={() => {
                setIsDarkMode(!isDarkMode);
                triggerToast(!isDarkMode ? "تم تفعيل الوضع الليلي" : "تم إلغاء الوضع الليلي");
              }}
              className={`p-2.5 border rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer shadow-xs active:scale-95 w-10 h-10 shrink-0 ${
                isDarkMode
                  ? "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
              title="تفعيل / إلغاء الوضع الليلي"
            >
              {isDarkMode ? <Sun className="w-5 h-5 shrink-0" /> : <Moon className="w-5 h-5 shrink-0" />}
            </button>
          </div>

        </div>
      </header>

      {/* --- Search Box Area (Persistent across screens) --- */}
      <section className={`transition-colors duration-300 border-b py-6 px-4 ${
        isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-b border-slate-200"
      }`}>
        <div className="w-full mx-auto">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              id="search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن ذكر مأثور، أو فضل، أو تصنيف، أو فرع مثل (الصلاة، الصدق)..."
              className={`w-full pr-12 pl-12 py-3.5 border rounded-2xl placeholder-slate-400 focus:outline-hidden focus:ring-4 transition-all text-xs font-medium ${
                isDarkMode
                  ? "bg-slate-850 border-slate-700 text-slate-100 focus:bg-slate-800 focus:border-blue-500 focus:ring-blue-500/20 shadow-none"
                  : "bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-blue-500/10 shadow-sm"
              }`}
            />
            {searchQuery && (
              <button
                id="clear-search-btn"
                onClick={() => setSearchQuery("")}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* --- Body Container --- */}
      <main className="flex-1 w-full mx-auto p-3 sm:p-5 lg:p-6 flex flex-col justify-start">
        
        {/* --- TOAST NOTIFICATION BANNER --- */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 border border-slate-800"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs">
                ✓
              </div>
              <span className="text-sm font-semibold">{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- VIEW 1: SEARCH RESULTS ACTIVE SCREEN --- */}
        {searchQuery.trim().length > 0 ? (
          <div className="w-full">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-950 font-display">
                  نتائج البحث عن: <span className="text-blue-600">"{searchQuery}"</span>
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  تم العثور على {searchResults.length} نص في مختلف الأقسام
                </p>
              </div>
              <button
                id="clear-search-link"
                onClick={() => setSearchQuery("")}
                className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
              >
                <X className="w-4 h-4" /> إغلاق البحث
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 text-center max-w-md mx-auto my-12">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-800">لم يتم العثور على نتائج</h3>
                <p className="text-slate-500 text-sm mt-2">
                  جرب استخدام كلمات مفتاحية أخرى، أو ابحث في تصفح الأقسام مباشرة.
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-6 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all"
                >
                  مسح مربع البحث
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.map(({ category, subBranch, item }) => {
                  const colors = getColorClasses(category.color);
                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-sm transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Breadcrumbs path */}
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-3 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-sm text-[10px] ${colors.bg} ${colors.text}`}>
                            {category.name}
                          </span>
                          <ChevronRight className="w-3 h-3" />
                          <span>{subBranch.name}</span>
                        </div>

                        {/* Text content with highlighted query */}
                        <p className="text-slate-800 text-base leading-relaxed font-medium mb-4 whitespace-pre-line">
                          {item.content}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <span className="text-xs font-semibold text-slate-400 italic">
                          {item.source || "غير محدد"}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setActiveCategoryId(category.id);
                              setActiveSubBranchId(subBranch.id);
                              setViewMode("explorer");
                              setSearchQuery("");
                            }}
                            title="الانتقال إلى التفريع لإدارته"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => copyToClipboard(item.content, item.id)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            {copiedTextId === item.id ? (
                              <Check className="w-4 h-4 text-blue-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          
          /* --- VIEW 2: NORMAL VIEWS (HOME / EXPLORER) --- */
          <AnimatePresence mode="wait">
            
            {/* 2A: HOME ORBITAL GRAPH MAP SCREEN */}
            {viewMode === "home" ? (
              <motion.div
                key="home-orbit"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full flex flex-col items-center"
              >
                {/* --- Main Interactive Mockup Card --- */}
                <div className={`w-full border shadow-sm rounded-3xl p-6 sm:p-10 relative overflow-hidden flex flex-col items-center transition-colors duration-300 ${
                  isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                }`}>
                  
                  {/* Subtle Grid Dotted Background exactly like Mockup */}
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1.5px,transparent_1.5px)] [background-size:20px_20px]"></div>
                  
                  {/* Outer border & floating design tokens */}


                  {/* Circle Map Layout */}
                  <div 
                    className="relative w-full aspect-square flex items-center justify-center mx-auto [--radius:40%]"
                    style={{
                      width: '100%',
                      maxWidth: 'min(640px, 72vh)',
                      maxHeight: 'min(640px, 72vh)'
                    }}
                  >
                    
                    {/* Animated Orbiting SVG Dotted Circle exactly like the mockup */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#2563eb"
                          strokeWidth="0.4"
                          strokeDasharray="2 3"
                          className="dashed-circle opacity-40 animate-[spin_120s_linear_infinite]"
                        />
                      </svg>
                    </div>

                    {/* CENTRAL MAIN CIRCLE - "فضائل" */}
                    <div className={`z-10 w-[50%] h-[50%] rounded-full border-2 sm:border-4 flex items-center justify-center shadow-xl overflow-hidden select-none transition-all duration-500 hover:scale-105 ${
                      isDarkMode ? "bg-slate-800 border-blue-500 shadow-blue-950/40" : "bg-white border-blue-400 shadow-blue-100/60"
                    }`}>
                      <motion.div
                        animate={{ scale: [1, 1.04, 1] }}
                        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                        className="w-full h-full flex items-center justify-center"
                      >
                        <img
                          src={fadaelLogo}
                          alt="فضائل"
                          className="w-full h-full object-cover scale-[1.15]"
                          referrerPolicy="no-referrer"
                        />
                      </motion.div>
                    </div>

                    {/* ORBITING CIRCLES (WITHOUT ICONS) */}
                    {categories.map((cat, index) => {
                      const count = categories.length;
                      const angle = (index * 2 * Math.PI) / count - Math.PI / 2; // Start from top
                      
                      const leftPos = `calc(50% + ${Math.cos(angle)} * var(--radius, 38%))`;
                      const topPos = `calc(50% + ${Math.sin(angle)} * var(--radius, 38%))`;

                      const colors = getColorClasses(cat.color);
                      const isSelected = selectedOrbitCategoryId === cat.id;

                      // Elegant active border colors
                      const activeBorderMap: Record<string, string> = {
                        emerald: "border-emerald-500 ring-emerald-500/15",
                        violet: "border-violet-500 ring-violet-500/15",
                        cyan: "border-cyan-500 ring-cyan-500/15",
                        amber: "border-amber-500 ring-amber-500/15",
                        sky: "border-sky-500 ring-sky-500/15",
                        teal: "border-teal-500 ring-teal-500/15",
                        pink: "border-pink-500 ring-pink-500/15",
                        indigo: "border-blue-500 ring-blue-500/15",
                        blue: "border-blue-500 ring-blue-500/15",
                        orange: "border-orange-500 ring-orange-500/15",
                      };

                      const hoverBorderMap: Record<string, string> = {
                        emerald: "hover:border-emerald-400 hover:text-emerald-800",
                        violet: "hover:border-violet-400 hover:text-violet-800",
                        cyan: "hover:border-cyan-400 hover:text-cyan-800",
                        amber: "hover:border-amber-400 hover:text-amber-800",
                        sky: "hover:border-sky-400 hover:text-sky-800",
                        teal: "hover:border-teal-400 hover:text-teal-800",
                        pink: "hover:border-pink-400 hover:text-pink-800",
                        indigo: "hover:border-blue-400 hover:text-blue-800",
                        blue: "hover:border-blue-400 hover:text-blue-800",
                        orange: "hover:border-orange-400 hover:text-orange-800",
                      };

                      const activeBorder = activeBorderMap[cat.color] || "border-emerald-500 ring-emerald-500/15";
                      const hoverBorder = hoverBorderMap[cat.color] || "hover:border-emerald-400";

                      const nameLen = cat.name.length;
                      const fontSizeClass = nameLen > 24
                        ? "text-[clamp(7.5px,1.5vw,11.5px)] leading-[1.12]"
                        : nameLen > 18
                        ? "text-[clamp(8px,1.8vw,12.5px)] leading-[1.15]"
                        : nameLen > 12
                        ? "text-[clamp(8.5px,2.1vw,14px)] leading-tight"
                        : "text-[clamp(9.5px,2.4vw,15.5px)] leading-tight";

                      return (
                        <motion.button
                          key={cat.id}
                          onClick={() => {
                            setActiveCategoryId(cat.id);
                            setActiveSubBranchId("");
                            setViewMode("explorer");
                          }}
                          style={{
                            position: "absolute",
                            left: leftPos,
                            top: topPos,
                          }}
                          className={`z-20 -translate-x-1/2 -translate-y-1/2 w-[24%] h-[24%] rounded-full border-2 flex flex-col items-center justify-center p-1.5 sm:p-2 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-lg overflow-hidden ${
                            isSelected
                              ? `${activeBorder} ring-4 scale-110 ${colors.bg}`
                              : `${isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-white border-slate-200/80 text-slate-700"} hover:scale-105 ${hoverBorder}`
                          }`}
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.95 }}
                          title="انقر للدخول مباشرة إلى هذا القسم"
                        >
                          <span className={`${fontSizeClass} font-black text-center whitespace-normal break-words max-w-full px-1.5 font-display flex items-center justify-center ${
                            isDarkMode ? "text-slate-100" : "text-slate-800"
                          }`}>
                            {cat.name}
                          </span>
                        </motion.button>
                      );
                    })}

                  </div>

                </div>

              </motion.div>
            ) : (
              
              /* 2B: DETAILED SECTION EXPLORER PAGE (LINKED VIEW) */
              <motion.div
                key="explorer-page"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="w-full flex flex-col gap-6 items-stretch"
              >
                
                {/* ========================================================= */}
                {/* SIDEBAR: SECTIONS LIST & CREATION (Horizontal bar) */}
                {/* ========================================================= */}
                 <aside className={`w-full border shadow-sm rounded-2xl p-4 flex flex-col gap-5 transition-colors duration-300 ${
                  isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                }`}>
                  
                  <div>
                    <div className={`flex items-center justify-between mb-4 pb-3 border-b ${
                      isDarkMode ? "border-slate-800" : "border-slate-100"
                    }`}>
                      <div className="flex items-center gap-2">
                        <h3 className={`font-extrabold text-xs font-display ${
                          isDarkMode ? "text-slate-100" : "text-slate-900"
                        }`}>
                          الأقسام الرئيسية
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                          isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
                        }`}>
                          {categories.length}
                        </span>
                      </div>
                    </div>

                    {/* List of categories (Horizontal Scrollable Flex Box) */}
                    <div className="flex flex-nowrap gap-2.5 overflow-x-auto pb-3 select-none scrollbar-thin scrollbar-thumb-slate-200">
                      {/* Home Button to return to home page */}
                      <button
                        onClick={() => {
                          setViewMode("home");
                          setSearchQuery("");
                        }}
                        className={`sticky right-0 z-10 flex items-center justify-center p-2 px-3 rounded-xl transition-all shrink-0 border cursor-pointer shadow-md ${
                          isDarkMode
                            ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white"
                            : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900"
                        }`}
                        title="الرجوع للصفحة الرئيسية"
                      >
                        <Home className="w-4 h-4" />
                      </button>

                      {categories.map((cat) => {
                        const theme = getThemeColors(cat.color);
                        const isActive = activeCategoryId === cat.id;

                        return (
                          <div
                            key={cat.id}
                            className={`group flex items-center gap-2.5 p-2 px-4 rounded-xl transition-all shrink-0 border ${
                              isActive
                                ? `font-black shadow-xs ${theme.catActive}`
                                : isDarkMode
                                  ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-slate-100 font-medium"
                                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-medium"
                            }`}
                          >
                            <button
                              onClick={() => {
                                setActiveCategoryId(cat.id);
                                // Auto select first sub-branch
                                if (cat.subBranches.length > 0) {
                                  setActiveSubBranchId(cat.subBranches[0].id);
                                } else {
                                  setActiveSubBranchId("");
                                }
                              }}
                              className="flex items-center gap-2 text-sm cursor-pointer"
                            >
                              <span className={`w-2.5 h-2.5 rounded-full ${
                                isActive 
                                  ? `${theme.catDotActive} animate-pulse` 
                                  : `${theme.catDotInactive}`
                              }`} />
                              <span>{cat.name}</span>
                            </button>
                          </div>
                        );
                      })}

                    </div>

                    {/* Add New Category form inline if open */}
                    {showAddCategoryForm && (
                      <div className={`mt-4 pt-4 border-t w-full ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
                        <form onSubmit={handleAddCategory} className={`space-y-4 p-5 rounded-2xl ${isDarkMode ? "bg-slate-800/60" : "bg-slate-50"}`}>
                          <div>
                            <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>اسم القسم الجديد</label>
                            <input
                              type="text"
                              required
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              placeholder="مثال: العبادات، السير..."
                              className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-hidden focus:border-blue-500 ${isDarkMode ? "bg-slate-900 border-slate-700 text-slate-100" : "bg-white border-slate-200"}`}
                            />
                          </div>

                          {/* Color Selection Grid */}
                          <div>
                            <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>سمة لون التصنيف</label>
                            <div className="grid grid-cols-5 gap-1.5">
                              {AVAILABLE_COLORS.map((color) => {
                                const maps = getColorClasses(color);
                                return (
                                  <button
                                    key={color}
                                    type="button"
                                    onClick={() => setNewCategoryColor(color)}
                                    className={`w-full h-6 rounded-md transition-all ${maps.pill} ${
                                      newCategoryColor === color ? "ring-2 ring-offset-1 ring-slate-850" : "opacity-80"
                                    }`}
                                  />
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button
                              type="submit"
                              className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              حفظ
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowAddCategoryForm(false)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${isDarkMode ? "bg-slate-700 hover:bg-slate-600 text-slate-200" : "bg-slate-200 hover:bg-slate-300 text-slate-700"}`}
                            >
                              إلغاء
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>

                  {/* Sub-Branches Dropdown List */}
                  <div className={`border-t pt-4 space-y-3 relative ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>

                    {!selectedCategory?.subBranches || selectedCategory.subBranches.length === 0 ? (
                      <div className={`border border-dashed rounded-2xl p-6 text-center ${isDarkMode ? "bg-slate-800/30 border-slate-750 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-400"}`}>
                        <span className="text-xs">لا توجد تفريعات في هذا القسم بعد. قم بإدخال فرع جديد أدناه!</span>
                      </div>
                    ) : (
                      <div
                        className="flex flex-nowrap gap-2.5 overflow-x-auto pb-3 select-none scrollbar-thin scroll-smooth cursor-grab active:cursor-grabbing"
                        onMouseDown={(e) => {
                          try {
                            const container = e.currentTarget;
                            if (!container) return;
                            const startX = e.pageX - container.offsetLeft;
                            const scrollLeft = container.scrollLeft;
                            
                            const handleMouseMove = (moveEvent: MouseEvent) => {
                              try {
                                if (!container || moveEvent.pageX === undefined) return;
                                const x = moveEvent.pageX - container.offsetLeft;
                                const walk = (x - startX) * 1.5;
                                container.scrollLeft = scrollLeft - walk;
                              } catch {}
                            };
                            
                            const handleMouseUp = () => {
                              try {
                                document.removeEventListener("mousemove", handleMouseMove);
                                document.removeEventListener("mouseup", handleMouseUp);
                              } catch {}
                            };
                            
                            document.addEventListener("mousemove", handleMouseMove);
                            document.addEventListener("mouseup", handleMouseUp);
                          } catch {}
                        }}
                      >
                        {(selectedCategory?.subBranches || []).map((sub) => {
                          const isActive = activeSubBranchId === sub.id;
                          const currentTheme = getThemeColors(selectedCategory.color);
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => setActiveSubBranchId(sub.id)}
                              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border transition-all text-xs font-bold shrink-0 shadow-xs cursor-pointer ${
                                isActive
                                  ? currentTheme.subActive
                                  : `${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"} ${currentTheme.subHover}`
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? `${currentTheme.subDotActive} animate-pulse` : currentTheme.subDotInactive}`} />
                              <span>{sub.name}</span>
                              <span className={`text-[10px] font-mono ${isActive ? (isDarkMode ? "text-blue-100" : "text-white/80") : "text-slate-400"}`}>
                                ({(sub.items || []).length})
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Add Sub-Branch Form */}
                    {showAddSubBranchForm && (
                      <div className="pt-1">
                        <form onSubmit={(e) => {
                          handleAddSubBranch(e);
                          setShowAddSubBranchForm(false);
                        }} className={`space-y-3 p-4 rounded-xl border ${isDarkMode ? "bg-slate-800/40 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                          <div>
                            <label className={`block text-xs font-bold mb-1 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>اسم الفرع الجديد</label>
                            <input
                              type="text"
                              required
                              value={newSubBranchName}
                              onChange={(e) => setNewSubBranchName(e.target.value)}
                              placeholder="مثال: فضل بر الوالدين، آداب الطعام..."
                              className={`w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-hidden focus:border-blue-500 ${isDarkMode ? "bg-slate-900 border-slate-700 text-slate-100" : "bg-white border-slate-200"}`}
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              حفظ الفرع
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddSubBranchForm(false);
                                setNewSubBranchName("");
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${isDarkMode ? "bg-slate-700 hover:bg-slate-600 text-slate-200" : "bg-slate-200 hover:bg-slate-300 text-slate-700"}`}
                            >
                              إلغاء
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>

                </aside>

                {/* ========================================================= */}
                {/* SUB-BRANCHES LIST & DETAILED TEXT CARDS (Columns: 12/12) */}
                {/* ========================================================= */}
                <section className="w-full space-y-6">
                  
                  {/* Active Category Header Card */}
                  <div className={`p-6 rounded-2xl border-r-4 border ${getCategoryGradient(selectedCategory?.color, isDarkMode)} flex flex-col gap-4 transition-colors duration-300`}>
                    <div className="flex items-center justify-center text-center gap-3 w-full">
                      <div className="w-full text-center">
                        <h2 className={`text-xl font-black font-display flex items-center justify-center text-center gap-2.5 flex-wrap ${
                          isDarkMode ? "text-slate-100" : "text-slate-900"
                        }`}>
                          <span className="text-center w-full">{selectedSubBranch ? selectedSubBranch.name : selectedCategory?.name}</span>
                        </h2>
                      </div>
                    </div>

                    {/* خدمات النصوص المنسقة - تظهر في سطر مستقل وفي الوسط */}
                    <div className={`pt-4 border-t grid grid-cols-6 gap-2 sm:gap-4 justify-items-stretch items-center w-full ${
                      isDarkMode ? "border-slate-800" : "border-slate-200/50"
                    }`}>
                      
                      {/* 0. الرجوع للرئيسة */}
                      <button
                        type="button"
                        id="back-to-home-btn"
                        onClick={() => { setViewMode("home"); setSearchQuery(""); }}
                        className={`p-1.5 min-[380px]:p-2 sm:p-2.5 border rounded-xl font-bold transition-all flex items-center justify-center cursor-pointer shadow-xs active:scale-95 w-full h-10 min-[380px]:h-12 sm:h-14 ${
                          isDarkMode
                            ? "bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700"
                            : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                        title="الرجوع للصفحة الرئيسية"
                      >
                        <ArrowRight className={`w-5 h-5 min-[380px]:w-[22px] min-[380px]:h-[22px] sm:w-6 sm:h-6 shrink-0 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
                      </button>

                      {/* 1. تغيير نوع الخط */}
                      <button
                        type="button"
                        onClick={() => {
                          const fonts: ("font-tajawal" | "font-cairo" | "font-amiri" | "font-lateef" | "font-mohanad")[] = [
                            "font-tajawal",
                            "font-cairo",
                            "font-amiri",
                            "font-lateef",
                            "font-mohanad"
                          ];
                          const currentIndex = fonts.indexOf(activeFont);
                          const nextIndex = (currentIndex + 1) % fonts.length;
                          setActiveFont(fonts[nextIndex]);
                          const fontNamesAr = {
                            "font-tajawal": "خط التناول (تجوال)",
                            "font-cairo": "خط القاهرة (كايرو)",
                            "font-amiri": "الخط الأميري الكلاسيكي",
                            "font-lateef": "خط لطيف (النسخ العريض)",
                            "font-mohanad": "خط المهند (عريض)"
                          };
                          triggerToast(`تم تغيير الخط إلى: ${fontNamesAr[fonts[nextIndex]]}`);
                        }}
                        className={`p-1.5 min-[380px]:p-2 sm:p-2.5 border rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer shadow-xs active:scale-95 w-full h-10 min-[380px]:h-12 sm:h-14 ${
                          isDarkMode
                            ? "bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700"
                            : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                        title="تغيير نوع خط عرض نصوص الأحاديث والفضائل"
                      >
                        <Type className={`w-5 h-5 min-[380px]:w-[22px] min-[380px]:h-[22px] sm:w-6 sm:h-6 shrink-0 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
                      </button>

                      {/* 2. تكبير الخط بالنقر فقط */}
                      <button
                        type="button"
                        onClick={() => {
                          setTextSize(prev => {
                            const next = prev >= 28 ? 12 : prev + 2;
                            triggerToast(`حجم الخط الحالي: ${next}px`);
                            return next;
                          });
                        }}
                        className={`p-1.5 min-[380px]:p-2 sm:p-2.5 border rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer shadow-xs active:scale-95 w-full h-10 min-[380px]:h-12 sm:h-14 ${
                          isDarkMode
                            ? "bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700"
                            : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                        title="تكبير وتصغير حجم النص عند النقر"
                      >
                        <span className={`text-sm min-[380px]:text-base sm:text-lg font-black shrink-0 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>A+</span>
                      </button>

                      {/* 3. القراءة بملء الصفحة */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsFullscreen(!isFullscreen);
                          triggerToast(!isFullscreen ? "تم تفعيل وضع القراءة بملء الصفحة" : "تم إلغاء وضع القراءة");
                        }}
                        className={`p-1.5 min-[380px]:p-2 sm:p-2.5 border rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer shadow-xs active:scale-95 w-full h-10 min-[380px]:h-12 sm:h-14 ${
                          isFullscreen
                            ? isDarkMode
                              ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-950/40"
                              : "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100"
                            : isDarkMode
                              ? "bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700"
                              : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                        title="تفعيل أو إلغاء وضع القراءة بملء الصفحة"
                      >
                        {isFullscreen ? (
                          <Minimize2 className="w-5 h-5 min-[380px]:w-[22px] min-[380px]:h-[22px] sm:w-6 sm:h-6 shrink-0" />
                        ) : (
                          <Maximize2 className={`w-5 h-5 min-[380px]:w-[22px] min-[380px]:h-[22px] sm:w-6 sm:h-6 shrink-0 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
                        )}
                      </button>

                      {/* 4. تغيير الخلفية */}
                      <button
                        type="button"
                        onClick={() => {
                          const bgs: ("default" | "cream" | "dark" | "mint")[] = ["default", "cream", "dark", "mint"];
                          const currentIndex = bgs.indexOf(textBgStyle);
                          const nextIndex = (currentIndex + 1) % bgs.length;
                          setTextBgStyle(bgs[nextIndex]);
                          const bgNamesAr = {
                            "default": "الافتراضي المشرق",
                            "cream": "الورقي الدافئ (سيبيا)",
                            "dark": "الأزرق الفاتح الجذاب",
                            "mint": "النعناعي المريح"
                          };
                          triggerToast(`تم تغيير خلفية القراءة إلى: ${bgNamesAr[bgs[nextIndex]]}`);
                        }}
                        className={`p-1.5 min-[380px]:p-2 sm:p-2.5 border rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer shadow-xs active:scale-95 w-full h-10 min-[380px]:h-12 sm:h-14 ${
                          isDarkMode
                            ? "bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700"
                            : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                        title="تغيير لون خلفية عرض النصوص"
                      >
                        <Palette className={`w-5 h-5 min-[380px]:w-[22px] min-[380px]:h-[22px] sm:w-6 sm:h-6 shrink-0 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
                      </button>

                      {/* 5. حذف التشكيل */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsWithoutHarakat(!isWithoutHarakat);
                          triggerToast(!isWithoutHarakat ? "تم إخفاء التشكيل من النصوص" : "تم إظهار التشكيل بالكامل");
                        }}
                        className={`p-1.5 min-[380px]:p-2 sm:p-2.5 border rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer shadow-xs active:scale-95 w-full h-10 min-[380px]:h-12 sm:h-14 ${
                          isWithoutHarakat
                            ? isDarkMode
                              ? "bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-950/40"
                              : "bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-100"
                            : isDarkMode
                              ? "bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700"
                              : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                        title="إزالة الحركات وتشكيل الحروف لسهولة القراءة"
                      >
                        {isWithoutHarakat ? (
                          <Eye className="w-5 h-5 min-[380px]:w-[22px] min-[380px]:h-[22px] sm:w-6 sm:h-6 shrink-0" />
                        ) : (
                          <EyeOff className={`w-5 h-5 min-[380px]:w-[22px] min-[380px]:h-[22px] sm:w-6 sm:h-6 shrink-0 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
                        )}
                      </button>

                    </div>
                  </div>


                  {/* ========================================================= */}
                  {/* TEXT ITEMS VIEW & CREATION WORKSPACE */}
                  {/* ========================================================= */}
                  <div className={`border shadow-sm rounded-2xl p-6 space-y-6 transition-colors duration-300 relative overflow-hidden ${
                    isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                  }`}>
                    {/* Decorative Blue Top Stripe */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-sky-400 to-blue-500 z-10" />
                    
                    {/* Elements deleted as requested */}

                    {/* Quick Add Text Form */}
                    {showAddTextForm && selectedSubBranch && (
                      <motion.form
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onSubmit={handleAddText}
                        className={`p-5 rounded-2xl border space-y-4 ${
                          isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-slate-50/70 border-slate-200/80"
                        }`}
                      >
                        <h4 className={`font-extrabold text-xs flex items-center gap-1 border-b pb-2 ${
                          isDarkMode ? "text-slate-200 border-slate-700" : "text-slate-800 border-slate-200"
                        }`}>
                          <Plus className="w-4 h-4 text-blue-500" />
                          إدراج نص جديد لفرع « {selectedSubBranch.name} »
                        </h4>

                        <div>
                          <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                            محتوى النص (حديث شريف، آية كريمة، ذكر مأثور، فضل مكتوب) <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            required
                            rows={3}
                            value={newTextContent}
                            onChange={(e) => setNewTextContent(e.target.value)}
                            placeholder="اكتب أو الصق نص الفضل المأثور هنا..."
                            className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-hidden focus:border-blue-500 font-medium ${
                              isDarkMode ? "bg-slate-900 border-slate-750 text-slate-100" : "bg-white border-slate-200"
                            }`}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                              المصدر والخرّيج (اختياري)
                            </label>
                            <input
                              type="text"
                              value={newTextSource}
                              onChange={(e) => setNewTextSource(e.target.value)}
                              placeholder="مثال: صحيح البخاري، سنن الترمذي..."
                              className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-hidden focus:border-blue-500 font-medium ${
                                isDarkMode ? "bg-slate-900 border-slate-750 text-slate-100" : "bg-white border-slate-200"
                              }`}
                            />
                          </div>

                          <div>
                            <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                              الوسوم / الكلمات المفتاحية (مفصولة بفاصلة)
                            </label>
                            <input
                              type="text"
                              value={newTextTags}
                              onChange={(e) => setNewTextTags(e.target.value)}
                              placeholder="مثال: صلاة الفجر، أجر عظيم، تكفير ذنوب..."
                              className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-hidden focus:border-blue-500 font-medium ${
                                isDarkMode ? "bg-slate-900 border-slate-750 text-slate-100" : "bg-white border-slate-200"
                              }`}
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-1">
                          <button
                            type="submit"
                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-900/35 cursor-pointer"
                          >
                            حفظ وإدراج النص
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddTextForm(false)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isDarkMode ? "bg-slate-700 hover:bg-slate-600 text-slate-200" : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                            }`}
                          >
                            إلغاء
                          </button>
                        </div>
                      </motion.form>
                    )}

                    {/* Inline Text Editor */}
                    {editingTextId && (
                      <motion.form
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onSubmit={handleSaveEditedText}
                        className={`p-5 rounded-2xl border shadow-xs space-y-4 ${
                          isDarkMode ? "bg-slate-800/70 border-yellow-850/40" : "bg-yellow-50/70 border-yellow-200"
                        }`}
                      >
                        <h4 className={`font-bold text-xs border-b pb-2 ${
                          isDarkMode ? "text-yellow-450 border-yellow-800/30" : "text-yellow-800 border-yellow-100"
                        }`}>
                          تعديل النص المحدد 📝
                        </h4>

                        <div>
                          <label className={`block text-xs font-bold mb-1 ${isDarkMode ? "text-slate-300" : "text-slate-500"}`}>المحتوى المعدّل</label>
                          <textarea
                            required
                            rows={3}
                            value={editingTextContent}
                            onChange={(e) => setEditingTextContent(e.target.value)}
                            className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-hidden focus:border-yellow-500 font-medium ${
                              isDarkMode ? "bg-slate-900 border-slate-700 text-slate-100" : "bg-white border-yellow-200"
                            }`}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={`block text-xs font-bold mb-1 ${isDarkMode ? "text-slate-300" : "text-slate-500"}`}>المصدر</label>
                            <input
                              type="text"
                              value={editingTextSource}
                              onChange={(e) => setEditingTextSource(e.target.value)}
                              className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-hidden focus:border-yellow-500 font-medium ${
                                isDarkMode ? "bg-slate-900 border-slate-700 text-slate-100" : "bg-white border-yellow-200"
                              }`}
                            />
                          </div>
                          <div>
                            <label className={`block text-xs font-bold mb-1 ${isDarkMode ? "text-slate-300" : "text-slate-500"}`}>الوسوم (مفصولة بفاصلة)</label>
                            <input
                              type="text"
                              value={editingTextTags}
                              onChange={(e) => setEditingTextTags(e.target.value)}
                              className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-hidden focus:border-yellow-500 font-medium ${
                                isDarkMode ? "bg-slate-900 border-slate-700 text-slate-100" : "bg-white border-yellow-200"
                              }`}
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-1">
                          <button
                            type="submit"
                            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            حفظ التعديلات
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTextId(null)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isDarkMode ? "bg-slate-700 hover:bg-slate-600 text-slate-200" : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                            }`}
                          >
                            إلغاء التعديل
                          </button>
                        </div>
                      </motion.form>
                    )}

                    {/* Texts Listing Cards */}
                    {!selectedSubBranch ? (
                      <div className={`border border-dashed rounded-2xl p-8 text-center ${
                        isDarkMode ? "bg-slate-850/30 border-slate-750 text-slate-400" : "bg-white border-slate-200 text-slate-400"
                      }`}>
                        الرجاء تحديد فرع من القائمة أعلاه لعرض الأحاديث والنصوص الفاضلة.
                      </div>
                    ) : !selectedSubBranch.items || selectedSubBranch.items.length === 0 ? (
                      <div className={`border border-dashed rounded-2xl p-10 text-center space-y-3 ${
                        isDarkMode ? "bg-slate-850/30 border-slate-750 text-slate-400" : "bg-white border-slate-200 text-slate-400"
                      }`}>
                        <p className={`text-sm ${isDarkMode ? "text-slate-300" : "text-slate-500"}`}>
                          لا توجد نصوص مدرجة حالياً في فرع « <span className="font-bold text-blue-500">{selectedSubBranch.name}</span> »
                        </p>
                        <p className="text-slate-400 text-xs">
                          كن أول من يسجل ويدرج حديثاً أو ذكراً عظيماً في هذا الفرع بالنقر فوق الزر بالجانب.
                        </p>
                        <button
                          onClick={() => setShowAddTextForm(true)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                            isDarkMode ? "bg-blue-900/30 hover:bg-blue-900/50 text-blue-400" : "bg-blue-50 hover:bg-blue-100 text-blue-700"
                          }`}
                        >
                          إدراج أول نص الآن
                        </button>
                      </div>
                    ) : (
                      (() => {
                        const bt = isDarkMode
                          ? textBgStyle === "cream"
                            ? {
                                bg: "bg-[#1E1A14] text-[#EADFC9] border-[#3E342B]",
                                border: "border-[#3E342B]",
                                innerBorder: "border-amber-900/10",
                                line: "border-amber-900/10",
                                heading: "text-amber-500/70",
                                badge: "bg-amber-900/10 border-amber-900/20 text-amber-500",
                                marker: "bg-amber-900/5 text-amber-500 border-amber-900/10",
                                srcColor: "text-amber-400/60",
                                btn: "bg-amber-950/40 border-amber-900/30 text-amber-400 hover:bg-amber-900/30 hover:text-amber-300"
                              }
                            : textBgStyle === "dark"
                            ? {
                                bg: "bg-[#0B132B] text-[#E0E1DD] border-[#1D2D44]",
                                border: "border-[#1D2D44]",
                                innerBorder: "border-[#1D2D44]/30",
                                line: "border-[#1D2D44]/30",
                                heading: "text-sky-400/70",
                                badge: "bg-[#1D2D44]/40 border-[#1D2D44]/60 text-sky-400",
                                marker: "bg-sky-950/20 text-sky-400 border-sky-900/20",
                                srcColor: "text-sky-400/60",
                                btn: "bg-[#15233E] border-[#253D6D] text-sky-400 hover:bg-[#1C2E52] hover:text-sky-300"
                              }
                            : textBgStyle === "mint"
                            ? {
                                bg: "bg-[#0E1B15] text-[#D1E7DD] border-[#1E3A2F]",
                                border: "border-[#1E3A2F]",
                                innerBorder: "border-[#1E3A2F]/30",
                                line: "border-[#1E3A2F]/30",
                                heading: "text-emerald-400/70",
                                badge: "bg-[#1E3A2F]/40 border-[#1E3A2F]/60 text-emerald-400",
                                marker: "bg-emerald-950/20 text-emerald-400 border-emerald-900/20",
                                srcColor: "text-emerald-400/60",
                                btn: "bg-[#12261E] border-[#234B3B] text-emerald-400 hover:bg-[#1A372B] hover:text-emerald-300"
                              }
                            : {
                                bg: "bg-slate-950 text-slate-100 border-slate-900",
                                border: "border-slate-900",
                                innerBorder: "border-slate-800/40",
                                line: "border-slate-800/40",
                                heading: "text-slate-400/70",
                                badge: "bg-slate-900 border-slate-800 text-slate-400",
                                marker: "bg-slate-900/50 text-slate-400 border-slate-800",
                                srcColor: "text-slate-400/60",
                                btn: "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white"
                              }
                          : textBgStyle === "cream"
                          ? {
                              bg: "bg-[#FAF5EB] text-[#422C1B] border-[#D6C5B3]",
                              border: "border-[#D6C5B3]",
                              innerBorder: "border-amber-900/10",
                              line: "border-amber-900/10",
                              heading: "text-amber-800/70",
                              badge: "bg-amber-900/5 border-amber-900/10 text-amber-800",
                              marker: "bg-amber-900/5 text-amber-800 border-amber-900/10",
                              srcColor: "text-amber-800/60",
                              btn: "bg-[#FAF5EB] border-amber-200/50 text-amber-800 hover:bg-amber-100 hover:text-amber-900"
                            }
                          : textBgStyle === "dark"
                          ? {
                              bg: "bg-[#F0F9FF] text-[#0369A1] border-[#BAE6FD]",
                              border: "border-[#BAE6FD]",
                              innerBorder: "border-sky-200/30",
                              line: "border-sky-200/30",
                              heading: "text-sky-700/70",
                              badge: "bg-sky-50 border-sky-100 text-sky-700",
                              marker: "bg-sky-50 text-sky-700 border-sky-100",
                              srcColor: "text-sky-600/70",
                              btn: "bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100 hover:text-sky-850"
                            }
                          : textBgStyle === "mint"
                          ? {
                              bg: "bg-[#F4FCF6] text-[#143F24] border-[#CCEFE0]",
                              border: "border-[#CCEFE0]",
                              innerBorder: "border-emerald-200/30",
                              line: "border-emerald-200/30",
                              heading: "text-emerald-700/70",
                              badge: "bg-emerald-50 border-emerald-100 text-emerald-700",
                              marker: "bg-emerald-50 text-emerald-700 border-emerald-100",
                              srcColor: "text-emerald-600/70",
                              btn: "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-850"
                            }
                          : {
                              bg: "bg-white text-slate-800 border-slate-200/80 shadow-md",
                              border: "border-slate-200/80",
                              innerBorder: "border-slate-200/60",
                              line: "border-slate-200",
                              heading: "text-slate-400",
                              badge: "bg-slate-50 border-slate-200 text-slate-600",
                              marker: "bg-slate-50 text-slate-600 border-slate-200",
                              srcColor: "text-slate-500",
                              btn: "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                            };

                        return (
                          <div className={`rounded-3xl border transition-all duration-300 relative overflow-hidden shadow-md ${bt.bg}`}>
                            {/* Classic Double Inner Frame Border */}
                            <div className={`absolute inset-2 border-4 border-double rounded-2xl pointer-events-none ${bt.innerBorder}`} />

                            {/* Traditional Corner Accents */}
                            <div className={`absolute top-4 right-4 font-serif text-sm pointer-events-none select-none ${bt.heading}`}>✦</div>
                            <div className={`absolute top-4 left-4 font-serif text-sm pointer-events-none select-none ${bt.heading}`}>✦</div>
                            <div className={`absolute bottom-4 right-4 font-serif text-sm pointer-events-none select-none ${bt.heading}`}>✦</div>
                            <div className={`absolute bottom-4 left-4 font-serif text-sm pointer-events-none select-none ${bt.heading}`}>✦</div>

                            {/* Book Header */}
                            <div className={`relative z-10 flex items-center justify-center border-b border-solid px-6 sm:px-8 py-3 text-xs font-bold font-display select-none ${bt.line} ${bt.heading}`}>
                              <span className={`text-[10px] font-black font-serif px-2.5 py-1 rounded-full border ${bt.badge}`}>
                                ✦ {selectedSubBranch?.name || selectedCategory?.name || ""} ✦
                              </span>
                            </div>

                            {/* Book Spine Crease Effect */}
                            <div className={`absolute top-12 bottom-0 left-1/2 -translate-x-1/2 w-[1px] hidden md:block pointer-events-none z-20 ${bt.innerBorder}`} />
                            <div className="absolute top-12 bottom-0 left-1/2 -translate-x-1/2 w-12 bg-gradient-to-r from-transparent via-black/[0.02] dark:via-black/[0.1] to-transparent hidden md:block pointer-events-none z-20" />

                            {/* Book Content Listing */}
                            <div className={`relative z-10 divide-y divide-solid px-6 sm:px-8 md:px-12 py-6 space-y-6 sm:space-y-7 ${bt.line}`}>
                              {(selectedSubBranch?.items || []).map((item, index) => {
                                const arabNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
                                const toArabicWords = (num: number) => {
                                  return String(num).split("").map(d => arabNumerals[parseInt(d)] || d).join("");
                                };

                                return (
                                  <div
                                    key={item.id}
                                    className="pt-5 sm:pt-6 first:pt-0 group relative space-y-3.5 animate-fadeIn"
                                    dir="rtl"
                                  >
                                    {/* Ornamental Index Header */}
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[10px] font-serif font-black px-2.5 py-0.5 rounded border select-none ${bt.marker}`}>
                                        {toArabicWords(index + 1)}
                                      </span>
                                    </div>

                                    {/* Hadith Content verbatim from source */}
                                    <p 
                                      className={`leading-loose font-semibold relative z-10 whitespace-pre-line text-right ${activeFont}`}
                                      style={{ fontSize: `${textSize}px`, lineHeight: "2" }}
                                    >
                                      {isWithoutHarakat ? stripDiacritics(item.content) : item.content}
                                    </p>

                                    {/* Hadith Source and ONLY Copy and Share Buttons directly AFTER the text */}
                                    <div className={`flex flex-wrap items-center justify-between gap-4 pt-2 !mt-2 border-t border-solid relative z-10 ${bt.line}`}>
                                      <div className={`flex items-center gap-1.5 text-xs font-bold opacity-75 relative -translate-y-0.5 ${bt.srcColor}`}>
                                        <span className="italic">{item.source || "غير محدد"}</span>
                                      </div>

                                      {/* Actions toolbar containing ONLY copy and share */}
                                      <div className="flex items-center gap-2">
                                        {/* Copy Button */}
                                        <button
                                          onClick={() => copyToClipboard(item.content, item.id)}
                                          className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all duration-250 cursor-pointer flex items-center gap-1.5 active:scale-95 ${bt.btn}`}
                                          title="نسخ الحديث الشريف"
                                        >
                                          {copiedTextId === item.id ? (
                                            <>
                                              <Check className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                                              <span className="text-[10px] text-emerald-500 font-extrabold">تم النسخ</span>
                                            </>
                                          ) : (
                                            <>
                                              <Copy className="w-3.5 h-3.5" />
                                              <span>نسخ</span>
                                            </>
                                          )}
                                        </button>

                                        {/* Share Button */}
                                        <button
                                          onClick={() => handleShare(item.content, item.source)}
                                          className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all duration-250 cursor-pointer flex items-center gap-1.5 active:scale-95 ${bt.btn}`}
                                          title="مشاركة الحديث الشريف"
                                        >
                                          <Share2 className="w-3.5 h-3.5" />
                                          <span>مشاركة</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Book Footer Page Indicator */}
                            <div className={`relative z-10 border-t border-dashed px-6 sm:px-8 py-3.5 text-center text-[10px] font-bold font-mono select-none ${bt.line} ${bt.heading}`}>
                              تصفح وتأمل في فضائل الأعمال • انتهى الباب المبارك
                            </div>
                          </div>
                        );
                      })()
                    )}

                  </div>

                </section>

              </motion.div>
            )}

          </AnimatePresence>
        )}

      </main>

      {/* --- Footer --- */}
      <footer className={`mt-12 border-t py-6 px-4 transition-colors duration-300 ${
        isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-center text-center">
          <p className="text-xs font-semibold text-slate-400">
            تطبيق فضائل
          </p>
        </div>
      </footer>

      {/* --- Fullscreen Immersive Reading Mode Overlay --- */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-50 overflow-y-auto p-4 md:p-8 flex flex-col transition-colors duration-300 ${
              isDarkMode
                ? textBgStyle === "dark"
                  ? "bg-[#020617] text-[#E0E1DD]"
                  : textBgStyle === "cream"
                  ? "bg-[#14120E] text-[#EADFC9]"
                  : textBgStyle === "mint"
                  ? "bg-[#07110C] text-[#D1E7DD]"
                  : "bg-slate-950 text-slate-100"
                : textBgStyle === "dark"
                  ? "bg-[#EFF6FF] text-[#1E40AF]"
                  : textBgStyle === "cream"
                  ? "bg-[#F5EFEB] text-[#433422]"
                  : textBgStyle === "mint"
                  ? "bg-[#ECFDF5] text-[#166534]"
                  : "bg-slate-50 text-slate-900"
            }`}
          >
            {/* Header Controls */}
            <div className={`w-full mx-auto flex flex-col gap-4 pb-6 border-b mb-8 shrink-0 items-start ${
              isDarkMode ? "border-slate-800" : "border-slate-200/50"
            }`}>
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-6 bg-blue-600 rounded-md" />
                <h1 className="text-xl font-black font-display">
                  قراءة ممتدة لـ {selectedSubBranch?.name || selectedCategory?.name}
                </h1>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Embedded control widgets inside fullscreen for better UX */}
                <button
                  type="button"
                  onClick={() => {
                    const fonts: ("font-tajawal" | "font-cairo" | "font-amiri" | "font-lateef")[] = [
                      "font-tajawal",
                      "font-cairo",
                      "font-amiri",
                      "font-lateef"
                    ];
                    const currentIndex = fonts.indexOf(activeFont);
                    const nextIndex = (currentIndex + 1) % fonts.length;
                    setActiveFont(fonts[nextIndex]);
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                    isDarkMode
                      ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200"
                      : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200"
                  }`}
                  title="تغيير الخط"
                >
                  الخط: {activeFont === "font-tajawal" ? "تجوال" : activeFont === "font-cairo" ? "كايرو" : activeFont === "font-amiri" ? "أميري" : "لطيف"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTextSize(prev => prev >= 28 ? 12 : prev + 2);
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                    isDarkMode
                      ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200"
                      : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200"
                  }`}
                  title="تكبير الخط"
                >
                  الحجم: {textSize}px
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const bgs: ("default" | "cream" | "dark" | "mint")[] = ["default", "cream", "dark", "mint"];
                    const currentIndex = bgs.indexOf(textBgStyle);
                    const nextIndex = (currentIndex + 1) % bgs.length;
                    setTextBgStyle(bgs[nextIndex]);
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                    isDarkMode
                      ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200"
                      : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200"
                  }`}
                  title="تغيير الخلفية"
                >
                  الخلفية: {textBgStyle === "default" ? "الافتراضية" : textBgStyle === "cream" ? "سيبيا" : textBgStyle === "dark" ? "أزرق فاتح" : "نعناع"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsWithoutHarakat(!isWithoutHarakat)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                    isDarkMode
                      ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200"
                      : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200"
                  }`}
                  title="حذف التشكيل"
                >
                  {isWithoutHarakat ? "بأشكال" : "بدون تشكيل"}
                </button>
                
                <button
                  type="button"
                  onClick={() => setIsFullscreen(false)}
                  className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                  title="إغلاق ملء الصفحة"
                >
                  <X className="w-4 h-4" />
                  <span>إغلاق</span>
                </button>
              </div>
            </div>

            {/* Content list */}
            <div className="w-full mx-auto flex-1 pb-12">
              {!selectedSubBranch || selectedSubBranch.items.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                  لا توجد نصوص لعرضها. يرجى اختيار فرع يحتوي على نصوص مسبقاً.
                </div>
              ) : (
                (() => {
                  const bt = isDarkMode
                    ? textBgStyle === "cream"
                      ? {
                          bg: "bg-[#1E1A14] text-[#EADFC9] border-[#3E342B]",
                          border: "border-[#3E342B]",
                          innerBorder: "border-amber-900/10",
                          line: "border-amber-900/10",
                          heading: "text-amber-500/70",
                          badge: "bg-amber-900/10 border-amber-900/20 text-amber-500",
                          marker: "bg-amber-900/5 text-amber-500 border-amber-900/10",
                          srcColor: "text-amber-400/60",
                          btn: "bg-amber-950/40 border-amber-900/30 text-amber-400 hover:bg-amber-900/30 hover:text-amber-300"
                        }
                      : textBgStyle === "dark"
                      ? {
                          bg: "bg-[#0B132B] text-[#E0E1DD] border-[#1D2D44]",
                          border: "border-[#1D2D44]",
                          innerBorder: "border-[#1D2D44]/30",
                          line: "border-[#1D2D44]/30",
                          heading: "text-sky-400/70",
                          badge: "bg-[#1D2D44]/40 border-[#1D2D44]/60 text-sky-400",
                          marker: "bg-sky-950/20 text-sky-400 border-sky-900/20",
                          srcColor: "text-sky-400/60",
                          btn: "bg-[#15233E] border-[#253D6D] text-sky-400 hover:bg-[#1C2E52] hover:text-sky-300"
                        }
                      : textBgStyle === "mint"
                      ? {
                          bg: "bg-[#0E1B15] text-[#D1E7DD] border-[#1E3A2F]",
                          border: "border-[#1E3A2F]",
                          innerBorder: "border-[#1E3A2F]/30",
                          line: "border-[#1E3A2F]/30",
                          heading: "text-emerald-400/70",
                          badge: "bg-[#1E3A2F]/40 border-[#1E3A2F]/60 text-emerald-400",
                          marker: "bg-emerald-950/20 text-emerald-400 border-emerald-900/20",
                          srcColor: "text-emerald-400/60",
                          btn: "bg-[#12261E] border-[#234B3B] text-emerald-400 hover:bg-[#1A372B] hover:text-emerald-300"
                        }
                      : {
                          bg: "bg-slate-950 text-slate-100 border-slate-900",
                          border: "border-slate-900",
                          innerBorder: "border-slate-800/40",
                          line: "border-slate-800/40",
                          heading: "text-slate-400/70",
                          badge: "bg-slate-900 border-slate-800 text-slate-400",
                          marker: "bg-slate-900/50 text-slate-400 border-slate-800",
                          srcColor: "text-slate-400/60",
                          btn: "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white"
                        }
                    : textBgStyle === "cream"
                    ? {
                        bg: "bg-[#FAF5EB] text-[#422C1B] border-[#D6C5B3]",
                        border: "border-[#D6C5B3]",
                        innerBorder: "border-amber-900/10",
                        line: "border-amber-900/10",
                        heading: "text-amber-800/70",
                        badge: "bg-amber-900/5 border-amber-900/10 text-amber-800",
                        marker: "bg-amber-900/5 text-amber-800 border-amber-900/10",
                        srcColor: "text-amber-800/60",
                        btn: "bg-[#FAF5EB] border-amber-200/50 text-amber-800 hover:bg-amber-100 hover:text-amber-900"
                      }
                    : textBgStyle === "dark"
                    ? {
                        bg: "bg-[#F0F9FF] text-[#0369A1] border-[#BAE6FD]",
                        border: "border-[#BAE6FD]",
                        innerBorder: "border-sky-200/30",
                        line: "border-sky-200/30",
                        heading: "text-sky-700/70",
                        badge: "bg-sky-50 border-sky-100 text-sky-700",
                        marker: "bg-sky-50 text-sky-700 border-sky-100",
                        srcColor: "text-sky-600/70",
                        btn: "bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100 hover:text-sky-850"
                      }
                    : textBgStyle === "mint"
                    ? {
                        bg: "bg-[#F4FCF6] text-[#143F24] border-[#CCEFE0]",
                        border: "border-[#CCEFE0]",
                        innerBorder: "border-emerald-200/30",
                        line: "border-emerald-200/30",
                        heading: "text-emerald-700/70",
                        badge: "bg-emerald-50 border-emerald-100 text-emerald-700",
                        marker: "bg-emerald-50 text-emerald-700 border-emerald-100",
                        srcColor: "text-emerald-600/70",
                        btn: "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-850"
                      }
                    : {
                        bg: "bg-white text-slate-800 border-slate-200/80 shadow-md",
                        border: "border-slate-200/80",
                        innerBorder: "border-slate-200/60",
                        line: "border-slate-200",
                        heading: "text-slate-400",
                        badge: "bg-slate-50 border-slate-200 text-slate-600",
                        marker: "bg-slate-50 text-slate-600 border-slate-200",
                        srcColor: "text-slate-500",
                        btn: "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      };

                  return (
                    <div className={`rounded-3xl border transition-all duration-300 relative overflow-hidden shadow-lg ${bt.bg}`}>
                      {/* Classic Double Inner Frame Border */}
                      <div className={`absolute inset-2 border-4 border-double rounded-2xl pointer-events-none ${bt.innerBorder}`} />

                      {/* Traditional Corner Accents */}
                      <div className={`absolute top-4 right-4 font-serif text-sm pointer-events-none select-none ${bt.heading}`}>✦</div>
                      <div className={`absolute top-4 left-4 font-serif text-sm pointer-events-none select-none ${bt.heading}`}>✦</div>
                      <div className={`absolute bottom-4 right-4 font-serif text-sm pointer-events-none select-none ${bt.heading}`}>✦</div>
                      <div className={`absolute bottom-4 left-4 font-serif text-sm pointer-events-none select-none ${bt.heading}`}>✦</div>

                      {/* Book Header */}
                      <div className={`relative z-10 flex items-center justify-center border-b border-solid px-6 sm:px-8 py-3 text-xs font-bold font-display select-none ${bt.line} ${bt.heading}`}>
                        <span className={`text-[10px] font-black font-serif px-2.5 py-1 rounded-full border ${bt.badge}`}>
                          ✦ {selectedSubBranch?.name || selectedCategory?.name || ""} ✦
                        </span>
                      </div>

                      {/* Book Spine Crease Effect */}
                      <div className={`absolute top-12 bottom-0 left-1/2 -translate-x-1/2 w-[1px] hidden md:block pointer-events-none z-20 ${bt.innerBorder}`} />
                      <div className="absolute top-12 bottom-0 left-1/2 -translate-x-1/2 w-12 bg-gradient-to-r from-transparent via-black/[0.02] dark:via-black/[0.1] to-transparent hidden md:block pointer-events-none z-20" />

                      {/* Book Content Listing */}
                      <div className={`relative z-10 divide-y divide-solid px-6 sm:px-8 md:px-12 py-8 space-y-10 ${bt.line}`}>
                        {(selectedSubBranch?.items || []).map((item, index) => {
                          const arabNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
                          const toArabicWords = (num: number) => {
                            return String(num).split("").map(d => arabNumerals[parseInt(d)] || d).join("");
                          };

                          return (
                            <div
                              key={item.id}
                              className="pt-10 first:pt-0 group relative space-y-4"
                              dir="rtl"
                            >
                              {/* Ornamental Index Header */}
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-serif font-black px-2.5 py-0.5 rounded border select-none ${bt.marker}`}>
                                  {toArabicWords(index + 1)}
                                </span>
                              </div>

                              {/* Hadith Content verbatim from source */}
                              <p 
                                className={`leading-loose font-semibold relative z-10 whitespace-pre-line text-right ${activeFont}`}
                                style={{ fontSize: `${textSize}px`, lineHeight: "2" }}
                              >
                                {isWithoutHarakat ? stripDiacritics(item.content) : item.content}
                              </p>

                              {/* Hadith Source and ONLY Copy and Share Buttons directly AFTER the text */}
                              <div className={`flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-solid relative z-10 ${bt.line}`}>
                                <div className={`flex items-center gap-1.5 text-xs font-bold opacity-75 ${bt.srcColor}`}>
                                  <span className="italic">{item.source || "غير محدد"}</span>
                                </div>

                                {/* Actions toolbar containing ONLY copy and share */}
                                <div className="flex items-center gap-2">
                                  {/* Copy Button */}
                                  <button
                                    onClick={() => copyToClipboard(item.content, item.id)}
                                    className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all duration-250 cursor-pointer flex items-center gap-1.5 active:scale-95 ${bt.btn}`}
                                    title="نسخ الحديث الشريف"
                                  >
                                    {copiedTextId === item.id ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                                        <span className="text-[10px] text-emerald-500 font-extrabold">تم النسخ</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>نسخ</span>
                                      </>
                                    )}
                                  </button>

                                  {/* Share Button */}
                                  <button
                                    onClick={() => handleShare(item.content, item.source)}
                                    className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all duration-250 cursor-pointer flex items-center gap-1.5 active:scale-95 ${bt.btn}`}
                                    title="مشاركة الحديث الشريف"
                                  >
                                    <Share2 className="w-3.5 h-3.5" />
                                    <span>مشاركة</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Book Footer Page Indicator */}
                      <div className={`relative z-10 border-t border-dashed px-6 sm:px-8 py-3.5 text-center text-[10px] font-bold font-mono select-none ${bt.line} ${bt.heading}`}>
                        تصفح وتأمل في فضائل الأعمال • انتهى الباب المبارك
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
            
            <div className="text-center text-[10px] text-slate-400 py-6 shrink-0 font-mono">
              اضغط على زر (إغلاق) للعودة إلى واجهة المتصفح الكامل
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Custom Delete Confirmation Dialog --- */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs cursor-pointer"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`relative w-full max-w-md p-6 rounded-2xl shadow-xl border overflow-hidden z-10 ${
                isDarkMode 
                  ? "bg-slate-900 border-slate-800 text-slate-100" 
                  : "bg-white border-slate-200 text-slate-900"
              }`}
            >
              <div className="flex items-start gap-4 text-right" dir="rtl">
                {/* Visual Icon indicator */}
                <div className="p-3 bg-rose-500/10 text-rose-500 rounded-full shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                
                <div className="flex-1 space-y-2">
                  <h3 className="text-lg font-bold font-display">
                    {deleteConfirm.type === "category" ? "تأكيد حذف القسم الرئيسي" : "تأكيد حذف التفريع"}
                  </h3>
                  
                  <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"} leading-relaxed`}>
                    {deleteConfirm.type === "category" ? (
                      <>
                        هل أنت متأكد من حذف القسم الرئيسي <span className="font-extrabold text-rose-500">"{deleteConfirm.name}"</span>؟ 
                        <br />
                        <span className="text-xs text-rose-400 mt-1 block">
                          تنبيه: سيؤدي هذا الإجراء إلى حذف كافة التفريعات والنصوص التابعة له نهائياً وبدون إمكانية للتراجع.
                        </span>
                      </>
                    ) : (
                      <>
                        هل أنت متأكد من حذف التفريع <span className="font-extrabold text-rose-500">"{deleteConfirm.name}"</span>؟ 
                        <br />
                        <span className="text-xs text-rose-400 mt-1 block">
                          تنبيه: سيتم حذف كافة الأحاديث والنصوص المرتبطة بهذا الفرع.
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              
              {/* Footer controls */}
              <div className="mt-6 flex flex-row-reverse gap-3" dir="rtl">
                <button
                  type="button"
                  onClick={executeDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold rounded-xl text-sm transition-all cursor-pointer shadow-sm shadow-rose-600/10"
                >
                  نعم، احذف نهائياً
                </button>
                
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  className={`px-4 py-2 font-semibold rounded-xl text-sm transition-all cursor-pointer ${
                    isDarkMode 
                      ? "bg-slate-800 hover:bg-slate-700 text-slate-300" 
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  تراجع وإلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
