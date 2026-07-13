import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, 
  FileText, 
  CheckCircle, 
  Clock, 
  ArrowRight, 
  Search, 
  Plus, 
  Check, 
  RotateCcw, 
  Upload, 
  Download, 
  Languages, 
  FileSpreadsheet, 
  AlertCircle, 
  Trash2, 
  Filter, 
  UserPlus, 
  AlertTriangle,
  Layers,
  ChevronRight,
  Sparkles,
  Info,
  X,
  Link2,
  Unlink,
  Eye,
  Database
} from 'lucide-react';
import * as XLSX from 'xlsx';

// Define Interfaces
interface Voter {
  srNo: string;
  name: string;
  epic: string;
  age: number | null;
  gender: string;
  houseNo: string;
  linkedFormNo?: string | null;
  familyId?: string | null;
  familyName?: string | null;
}

interface FormRecord {
  id: string;
  formNumber: string;
  recipientName: string;
  recipientMobile: string;
  voterSrNo: string | null; // linked voter SrNo
  voterName: string | null; // linked voter name
  status: 'Distributed' | 'Collected';
  distributedAt: string;
  collectedAt: string | null;
  notes?: string;
}

// Initial Sample Voters
const defaultVoters: Voter[] = [
  { srNo: "1", name: "पाटील सचिन सुखदेव (Patil Sachin Sukhdev)", epic: "XYZ1234567", age: 42, gender: "Male", houseNo: "12/A", familyId: "fam-patil", familyName: "पाटील कुटुंब (Patil Family)" },
  { srNo: "2", name: "पाटील सुनीता सचिन (Patil Sunita Sachin)", epic: "XYZ1234568", age: 38, gender: "Female", houseNo: "12/A", familyId: "fam-patil", familyName: "पाटील कुटुंब (Patil Family)" },
  { srNo: "3", name: "जोशी राहुल दत्तात्रय (Joshi Rahul Dattatray)", epic: "ABC9876543", age: 29, gender: "Male", houseNo: "45", familyId: "fam-joshi", familyName: "जोशी कुटुंब (Joshi Family)" },
  { srNo: "4", name: "जोशी मीनाक्षी राहुल (Joshi Minakshi Rahul)", epic: "ABC9876544", age: 26, gender: "Female", houseNo: "45", familyId: "fam-joshi", familyName: "जोशी कुटुंब (Joshi Family)" },
  { srNo: "5", name: "मोरे विनायक गणपत (More Vinayak Ganpat)", epic: "PQR1122334", age: 67, gender: "Male", houseNo: "89", familyId: "fam-more", familyName: "मोरे कुटुंब (More Family)" },
  { srNo: "6", name: "मोरे सुशीला विनायक (More Sushila Vinayak)", epic: "PQR1122335", age: 61, gender: "Female", houseNo: "89", familyId: "fam-more", familyName: "मोरे कुटुंब (More Family)" },
  { srNo: "7", name: "देशमुख अमोल अनंत (Deshmukh Amol Anant)", epic: "MHR8877665", age: 45, gender: "Male", houseNo: "112", familyId: "fam-deshmukh", familyName: "देशमुख कुटुंब (Deshmukh Family)" },
  { srNo: "8", name: "देशमुख प्राजक्ता अमोल (Deshmukh Prajakta Amol)", epic: "MHR8877666", age: 40, gender: "Female", houseNo: "112", familyId: "fam-deshmukh", familyName: "देशमुख कुटुंब (Deshmukh Family)" },
];

// Initial Sample Forms
const defaultForms: FormRecord[] = [
  {
    id: "f-1",
    formNumber: "4501",
    recipientName: "सचिन सुखदेव पाटील",
    recipientMobile: "9823456789",
    voterSrNo: "1",
    voterName: "पाटील सचिन सुखदेव (Patil Sachin Sukhdev)",
    status: "Collected",
    distributedAt: "2026-07-10T09:30:00.000Z",
    collectedAt: "2026-07-11T08:15:00.000Z",
    notes: "स्वतःचा फॉर्म जमा केला"
  },
  {
    id: "f-2",
    formNumber: "4502",
    recipientName: "सचिन सुखदेव पाटील", // same recipient taking for relative
    recipientMobile: "9823456789",
    voterSrNo: "2",
    voterName: "पाटील सुनीता सचिन (Patil Sunita Sachin)",
    status: "Distributed",
    distributedAt: "2026-07-10T09:32:00.000Z",
    collectedAt: null,
    notes: "पत्नीचा फॉर्म घेऊन गेले"
  },
  {
    id: "f-3",
    formNumber: "4505",
    recipientName: "राहुल दत्तात्रय जोशी",
    recipientMobile: "9422001122",
    voterSrNo: "3",
    voterName: "जोशी राहुल दत्तात्रय (Joshi Rahul Dattatray)",
    status: "Distributed",
    distributedAt: "2026-07-11T10:00:00.000Z",
    collectedAt: null,
    notes: "घरून स्वाक्षरी करून आणणार"
  }
];

export default function App() {
  // Lang Toggle: 'mr' (Marathi) or 'en' (English) - default to English 'en'
  const [lang, setLangState] = useState<'mr' | 'en'>(() => {
    const saved = localStorage.getItem('blo_lang');
    return (saved === 'mr' || saved === 'en') ? saved : 'en';
  });

  const setLang = (newLang: 'mr' | 'en') => {
    setLangState(newLang);
    localStorage.setItem('blo_lang', newLang);
  };

  // References for swift/easy cursor focus transitions
  const recipientNameRef = useRef<HTMLInputElement>(null);
  const recipientMobileRef = useRef<HTMLInputElement>(null);
  const tempFormNumberRef = useRef<HTMLInputElement>(null);

  // App Tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'distribution' | 'collection' | 'voters' | 'reports'>('dashboard');

  // Core States (Loaded from LocalStorage or default)
  const [voters, setVoters] = useState<Voter[]>([]);
  const [forms, setForms] = useState<FormRecord[]>([]);

  // Form input states (Distribution)
  const [recipientName, setRecipientName] = useState('');
  const [recipientMobile, setRecipientMobile] = useState('');
  const [selectedFormNumbers, setSelectedFormNumbers] = useState<string[]>([]);
  const [tempFormNumber, setTempFormNumber] = useState('');
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [formInputMode, setFormInputMode] = useState<'quick' | 'range'>('quick');
  const [distNotes, setDistNotes] = useState('');
  const [selectedVoterSrNo, setSelectedVoterSrNo] = useState<string>('');

  // Searching & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [voterSearchQuery, setVoterSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Distributed' | 'Collected'>('all');
  const [formSortOrder, setFormSortOrder] = useState<'form-asc' | 'form-desc' | 'date-desc' | 'date-asc'>('form-asc');

  // OCR Upload states
  const [ocrText, setOcrText] = useState('');
  const [isParsingOcr, setIsParsingOcr] = useState(false);
  const [ocrError, setOcrError] = useState('');
  const [showOcrModal, setShowOcrModal] = useState(false);

  // Manual voter form
  const [showAddVoterModal, setShowAddVoterModal] = useState(false);
  const [newVoterSrNo, setNewVoterSrNo] = useState('');
  const [newVoterName, setNewVoterName] = useState('');
  const [newVoterEpic, setNewVoterEpic] = useState('');
  const [newVoterAge, setNewVoterAge] = useState('');
  const [newVoterGender, setNewVoterGender] = useState('Male');
  const [newVoterHouseNo, setNewVoterHouseNo] = useState('');

  // Family Connection states
  const [showLinkFamilyModal, setShowLinkFamilyModal] = useState(false);
  const [linkingVoter, setLinkingVoter] = useState<Voter | null>(null);
  const [familySearchQuery, setFamilySearchQuery] = useState('');
  const [selectedFamilyTargetSrNo, setSelectedFamilyTargetSrNo] = useState('');
  const [groupByFamily, setGroupByFamily] = useState(false);
  const [selectedFamilyFilter, setSelectedFamilyFilter] = useState<string | null>(null);
  const [customFamilyName, setCustomFamilyName] = useState('');

  // PDF Voter List Import states
  const [voterFile, setVoterFile] = useState<File | null>(null);
  const [voterFileBase64, setVoterFileBase64] = useState<string>('');
  const [voterFileMimeType, setVoterFileMimeType] = useState<string>('');
  const [voterFileError, setVoterFileError] = useState<string>('');
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [ocrInputMode, setOcrInputMode] = useState<'text' | 'file'>('file');

  // Excel Bulk Distribution Import states
  const [distributionInputMode, setDistributionInputMode] = useState<'manual' | 'bulk'>('manual');
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelError, setExcelError] = useState<string>('');
  const [excelPreviewRows, setExcelPreviewRows] = useState<any[]>([]);
  const [isProcessingExcel, setIsProcessingExcel] = useState(false);

  // Backup & Restore states
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [backupError, setBackupError] = useState<string>('');
  const [backupPreview, setBackupPreview] = useState<{ votersCount: number; formsCount: number; date: string } | null>(null);
  const [backupParsedData, setBackupParsedData] = useState<any | null>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'overwrite'>('merge');

  // PWA & App Install states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallInstructions, setShowInstallInstructions] = useState(false);

  // Notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Load Data
  useEffect(() => {
    const storedVoters = localStorage.getItem('blo_voters');
    const storedForms = localStorage.getItem('blo_forms');
    
    if (storedVoters) {
      setVoters(JSON.parse(storedVoters));
    } else {
      setVoters(defaultVoters);
      localStorage.setItem('blo_voters', JSON.stringify(defaultVoters));
    }

    if (storedForms) {
      setForms(JSON.parse(storedForms));
    } else {
      setForms(defaultForms);
      localStorage.setItem('blo_forms', JSON.stringify(defaultForms));
    }
  }, []);

  // Easy Entry Auto-focus transition
  useEffect(() => {
    if (activeTab === 'distribution' && distributionInputMode === 'manual') {
      const timer = setTimeout(() => {
        recipientNameRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTab, distributionInputMode]);

  // Capture PWA install prompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Save Data Helpers
  const saveVoters = (newVoters: Voter[]) => {
    setVoters(newVoters);
    localStorage.setItem('blo_voters', JSON.stringify(newVoters));
  };

  const saveForms = (newForms: FormRecord[]) => {
    setForms(newForms);
    localStorage.setItem('blo_forms', JSON.stringify(newForms));
  };

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // UI Translation Dictionary
  const t = {
    title: { mr: "BLO SIR फॉर्म ट्रॅकर", en: "BLO SIR Form Tracker" },
    subtitle: { mr: "महाराष्ट्र विधानसभा / लोकसभा निवडणूक - SIR फॉर्म व्यवस्थापन", en: "Maharashtra Assembly / Lok Sabha Elections - SIR Form Management" },
    tabDashboard: { mr: "डॅशबोर्ड", en: "Dashboard" },
    tabDistribution: { mr: "नवीन फॉर्म वाटप", en: "New Distribution" },
    tabCollection: { mr: "जमा / संकलन", en: "Collection & Search" },
    tabVoters: { mr: "मतदार यादी २०२४", en: "Voter List 2024" },
    tabReports: { mr: "अहवाल व निर्यात", en: "Reports & Export" },
    
    // Dashboard Stats
    totalVoters: { mr: "एकूण मतदार (यादी)", en: "Total Voters (Yaadi)" },
    distributed: { mr: "एकूण वाटप फॉर्म", en: "Total Distributed" },
    collected: { mr: "एकूण जमा फॉर्म", en: "Total Collected" },
    pending: { mr: "प्रलंबित फॉर्म", en: "Pending Forms" },
    completionRate: { mr: "पूर्णता दर", en: "Completion Rate" },
    recentActivity: { mr: "अलीकडील हालचाली", en: "Recent Activity" },
    quickStatus: { mr: "द्रुत आकडेवारी", en: "Quick Stats" },

    // Distribution
    distributionForm: { mr: "नवीन SIR फॉर्म वाटप नोंदणी", en: "New SIR Form Distribution Registry" },
    recipientDetails: { mr: "स्वीकारणाऱ्या मतदाराचे तपशील", en: "Recipient Details" },
    recipientNameLabel: { mr: "स्वीकारणाऱ्याचे पूर्ण नाव", en: "Full Name of Recipient" },
    recipientMobileLabel: { mr: "मोबाईल नंबर (१० अंकी)", en: "Mobile Number (10 Digit)" },
    recipientMobileHint: { mr: "एकाच मोबाईल नंबरवर नातेवाईकांचेही अनेक फॉर्म लिंक करता येतील.", en: "Multiple forms for relatives can be linked to this same mobile number." },
    formSelectionType: { mr: "फॉर्म प्रकार", en: "Form Type" },
    singleForm: { mr: "एक फॉर्म", en: "Single Form" },
    seriesForm: { mr: "फॉर्म मालिका / बुक (उदा. ५०१ ते ५०५)", en: "Form Series / Book (e.g. 501 to 505)" },
    formNoLabel: { mr: "फॉर्म क्रमांक", en: "Form Number" },
    formStartLabel: { mr: "सुरुवातीचा फॉर्म क्र.", en: "Start Form No." },
    formEndLabel: { mr: "शेवटचा फॉर्म क्र.", en: "End Form No." },
    voterLinkSection: { mr: "मतदार लिंक करा (यादीमधून निवडा)", en: "Link Voter (Select from Voter List)" },
    notesLabel: { mr: "टीप / रिमार्क (ऐच्छिक)", en: "Notes / Remarks (Optional)" },
    submitDistribution: { mr: "फॉर्म वाटप यशस्वी नोंदवा", en: "Submit Distribution Record" },
    addRelativeTip: { mr: "नातेवाईकांचे फॉर्म जोडण्यासाठी खालील मालिकेतील प्रत्येक फॉर्मला यादीतील मतदार लिंक करा:", en: "To add relatives' forms, link each form in the series to a voter below:" },

    // Collection & Search
    searchPlaceholder: { mr: "नाव, मोबाईल किंवा फॉर्म क्रमांकाने शोधा...", en: "Search by Name, Mobile, or Form Number..." },
    formNo: { mr: "फॉर्म क्र.", en: "Form No." },
    recipient: { mr: "स्वीकारकर्ता", en: "Recipient" },
    mobile: { mr: "मोबाईल", en: "Mobile" },
    voterLinked: { mr: "संबंधित मतदार", en: "Linked Voter" },
    status: { mr: "स्थिती", en: "Status" },
    action: { mr: "कृती", en: "Action" },
    markAsCollected: { mr: "जमा म्हणून नोंदवा", en: "Mark as Collected" },
    markAsDistributed: { mr: "पुन्हा वाटप करा (Pending)", en: "Mark as Distributed" },
    collectAll: { mr: "या व्यक्तीचे सर्व फॉर्म जमा करा", en: "Collect All Forms for this Person" },
    noRecords: { mr: "कोणतेही रेकॉर्ड सापडले नाहीत.", en: "No records found." },

    // Voter List
    importOcrBtn: { mr: "२०२४ मतदार यादी OCR डेटा आयात (AI)", en: "Import 2024 Yaadi OCR Data (AI)" },
    addVoterBtn: { mr: "नवीन मतदार जोडा", en: "Add Manual Voter" },
    voterSearchPlaceholder: { mr: "नाव, अनुक्रमांक किंवा EPIC कार्डने शोधा...", en: "Search voters by Name, Sr No, or EPIC..." },
    srNoCol: { mr: "अनुक्रमांक (Sr No)", en: "Sr No" },
    voterNameCol: { mr: "मतदाराचे नाव", en: "Voter Name" },
    epicCol: { mr: "EPIC कार्ड क्र.", en: "EPIC Card No" },
    ageGenderCol: { mr: "वय / लिंग", en: "Age / Gender" },
    houseNoCol: { mr: "घर क्र.", en: "House No" },
    formStatusCol: { mr: "SIR फॉर्म स्टेटस", en: "SIR Form Status" },
    notDistributed: { mr: "वाटप नाही", en: "Not Distributed" },
    
    // OCR Modal
    ocrTitle: { mr: "AI मतदार यादी OCR कनवर्टर", en: "AI Voter List OCR Converter" },
    ocrDescription: { mr: "तुमच्याकडे असलेली मतदार यादी (PDF/Image) मधील ओसीआर (OCR) केलेला मजकूर येथे पेस्ट करा. आमचे AI मॉडेल (Gemini) या मसुद्यामधील मतदार, त्यांचे अनुक्रमांक, घर क्रमांक, वय आणि ओळखपत्र क्रमांक स्वयंचलितपणे ओळखून डेटाबेस तयार करेल.", en: "Paste your OCR text from the 2024 voter list PDF here. Our AI (Gemini) will automatically extract voter Sr No, name, age, gender, EPIC card, and house number to build your database instantly." },
    ocrTextareaPlaceholder: { mr: "येथे ओसीआर केलेला मजकूर पेस्ट करा...\nउदा.\nअनुक्रमांक: २५६\nनाव: पाटील सचिन सुखदेव\nघर क्रमांक: १४३\nवय: ४२ लिंग: पुरुष\nओळखपत्र क्र.: XYZ0123456", en: "Paste OCRed text here...\ne.g.\nSerial No: 256\nName: Patil Sachin Sukhdev\nHouse No: 143\nAge: 42 Gender: Male\nEPIC No: XYZ0123456" },
    ocrSubmit: { mr: "AI द्वारे मतदार यादी संकलित करा", en: "Process & Import with Gemini AI" },
    ocrProcessing: { mr: "AI डेटा वाचत आहे, कृपया काही सेकंद प्रतीक्षा करा...", en: "AI is analyzing and parsing voter records, please wait..." },
    ocrSuccessMsg: { mr: "मतदार यशस्वीरित्या यादीमध्ये जोडले गेले आहेत!", en: "Voters successfully added to your digital list!" },

    // Reports
    downloadFullReport: { mr: "सर्व वाटप/जमा यादी डाउनलोड करा (CSV)", en: "Download Full Distribution Sheet (CSV)" },
    downloadPendingReport: { mr: "प्रलंबित फॉर्म कॉलिंग लिस्ट डाउनलोड करा (CSV)", en: "Download Pending Call List (CSV)" },
    downloadVotersReport: { mr: "पूर्ण मतदार स्थिती अहवाल (CSV)", en: "Download Complete Voter Status (CSV)" },
    resetDataBtn: { mr: "सर्व डेटा साफ करा (Reset)", en: "Reset Application Data" },
    resetConfirm: { mr: "तुम्हाला खात्री आहे का? सर्व वाटप आणि मतदार रेकॉर्ड नष्ट होतील!", en: "Are you sure? All distributed forms and custom voter records will be deleted!" }
  };

  // Derived dashboard metrics
  const metrics = useMemo(() => {
    const totalVotersCount = voters.length;
    const totalDistributed = forms.length;
    const totalCollected = forms.filter(f => f.status === 'Collected').length;
    const totalPending = totalDistributed - totalCollected;
    const completionPercentage = totalDistributed > 0 ? Math.round((totalCollected / totalDistributed) * 100) : 0;
    
    return {
      totalVotersCount,
      totalDistributed,
      totalCollected,
      totalPending,
      completionPercentage
    };
  }, [forms, voters]);

  // Suggested voters based on recipient name search
  const suggestedVoters = useMemo(() => {
    if (!recipientName.trim()) return [];
    const search = recipientName.toLowerCase();
    return voters.filter(v => 
      v.name.toLowerCase().includes(search) || 
      v.srNo === recipientName.trim()
    ).slice(0, 3);
  }, [voters, recipientName]);

  // Filters and searches forms for Collection Tab
  const filteredForms = useMemo(() => {
    const filtered = forms.filter(f => {
      const matchesSearch = 
        f.formNumber.includes(searchQuery) ||
        f.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.recipientMobile.includes(searchQuery) ||
        (f.voterName && f.voterName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (f.voterSrNo && f.voterSrNo.includes(searchQuery));

      const matchesStatus = 
        statusFilter === 'all' ? true : f.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Sort according to formSortOrder
    return filtered.sort((a, b) => {
      if (formSortOrder === 'form-asc') {
        return a.formNumber.localeCompare(b.formNumber, undefined, { numeric: true, sensitivity: 'base' });
      } else if (formSortOrder === 'form-desc') {
        return b.formNumber.localeCompare(a.formNumber, undefined, { numeric: true, sensitivity: 'base' });
      } else if (formSortOrder === 'date-desc') {
        return new Date(b.distributedAt).getTime() - new Date(a.distributedAt).getTime();
      } else if (formSortOrder === 'date-asc') {
        return new Date(a.distributedAt).getTime() - new Date(b.distributedAt).getTime();
      }
      return 0;
    });
  }, [forms, searchQuery, statusFilter, formSortOrder]);

  // Filters and searches voters for Voter Tab
  const filteredVoters = useMemo(() => {
    return voters.filter(v => {
      // If family filter is active, only show members of that family (same familyId or houseNo)
      if (selectedFamilyFilter) {
        const matchesFamily = 
          (v.familyId && v.familyId === selectedFamilyFilter) || 
          (v.houseNo && v.houseNo === selectedFamilyFilter);
        if (!matchesFamily) return false;
      }

      const matchesSearch = 
        v.name.toLowerCase().includes(voterSearchQuery.toLowerCase()) ||
        v.srNo.includes(voterSearchQuery) ||
        v.epic.toLowerCase().includes(voterSearchQuery.toLowerCase()) ||
        v.houseNo.includes(voterSearchQuery);

      return matchesSearch;
    });
  }, [voters, voterSearchQuery, selectedFamilyFilter]);

  // Grouped voters for family presentation
  const groupedVoters = useMemo(() => {
    if (!groupByFamily) return null;

    const groups: Record<string, { id: string; name: string; houseNo: string; members: Voter[] }> = {};

    filteredVoters.forEach(v => {
      // Use familyId as primary grouping key, fall back to houseNo
      const groupKey = v.familyId || `house-${v.houseNo || 'no-house'}`;

      if (!groups[groupKey]) {
        let groupName = lang === 'mr' ? `घर क्रमांक: ${v.houseNo || '—'}` : `House No: ${v.houseNo || '—'}`;
        if (v.familyName) {
          groupName = v.familyName;
        } else if (v.familyId) {
          // Find representative name (surname) from first member
          const surName = v.name.split(' ')[0] || '';
          groupName = lang === 'mr' ? `${surName} कुटुंब (घर क्र. ${v.houseNo})` : `${surName} Family (House ${v.houseNo})`;
        } else {
          groupName = lang === 'mr' ? `घर क्रमांक: ${v.houseNo || '—'}` : `House No: ${v.houseNo || '—'}`;
        }

        groups[groupKey] = {
          id: groupKey,
          name: groupName,
          houseNo: v.houseNo || '',
          members: []
        };
      }
      groups[groupKey].members.push(v);
    });

    return Object.values(groups);
  }, [filteredVoters, groupByFamily, lang]);

  const addFormNumberChip = (numStr: string) => {
    const clean = numStr.replace(/\D/g, '');
    if (!clean) {
      setTimeout(() => {
        tempFormNumberRef.current?.focus();
      }, 50);
      return;
    }
    if (selectedFormNumbers.includes(clean)) {
      showToast(lang === 'mr' ? "हा फॉर्म नंबर आधीच जोडला आहे!" : "This form number is already added!", 'info');
      setTimeout(() => {
        tempFormNumberRef.current?.focus();
      }, 50);
      return;
    }
    setSelectedFormNumbers([...selectedFormNumbers, clean]);
    setTempFormNumber('');
    setTimeout(() => {
      tempFormNumberRef.current?.focus();
    }, 50);
  };

  const removeFormNumberChip = (numStr: string) => {
    setSelectedFormNumbers(selectedFormNumbers.filter(n => n !== numStr));
  };

  const generateAndAddRange = () => {
    const start = parseInt(rangeStart);
    const end = parseInt(rangeEnd);
    if (isNaN(start) || isNaN(end)) {
      showToast(lang === 'mr' ? "कृपया वैध संख्या प्रविष्ट करा." : "Please enter valid numbers.", 'error');
      return;
    }
    if (start > end) {
      showToast(lang === 'mr' ? "सुरुवातीचा नंबर शेवटच्या नंबरपेक्षा लहान असावा!" : "Start number must be less than or equal to end number!", 'error');
      return;
    }
    const count = end - start + 1;
    if (count > 100) {
      showToast(lang === 'mr' ? "एका वेळी जास्तीत जास्त १०० फॉर्म जोडता येतील." : "You can add maximum of 100 forms at once.", 'error');
      return;
    }

    const addedList: string[] = [...selectedFormNumbers];
    let duplicateCount = 0;
    for (let i = start; i <= end; i++) {
      const ns = i.toString();
      if (!addedList.includes(ns)) {
        addedList.push(ns);
      } else {
        duplicateCount++;
      }
    }
    setSelectedFormNumbers(addedList);
    setRangeStart('');
    setRangeEnd('');
    if (duplicateCount > 0) {
      showToast(lang === 'mr' ? `${duplicateCount} फॉर्म नंबर आधीच जोडलेले होते.` : `${duplicateCount} form numbers were already added.`, 'info');
    } else {
      showToast(lang === 'mr' ? `${count} फॉर्म जोडले गेले!` : `${count} forms added!`, 'success');
    }
  };

  // Handle Form Distribution Submission
  const handleAddDistribution = (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipientName.trim()) {
      showToast(lang === 'mr' ? "कृपया स्वीकारणाऱ्याचे नाव टाका." : "Please enter recipient name.", 'error');
      return;
    }
    if (!recipientMobile.trim() || recipientMobile.length < 10) {
      showToast(lang === 'mr' ? "कृपया वैध १० अंकी मोबाईल नंबर टाका." : "Please enter a valid 10-digit mobile number.", 'error');
      return;
    }

    // Prepare final form numbers list
    let formsToSubmit = [...selectedFormNumbers];

    // If they typed something in the single input but didn't press space/add, let's add it!
    const cleanTemp = tempFormNumber.trim().replace(/\D/g, '');
    if (formInputMode === 'quick' && cleanTemp) {
      if (!formsToSubmit.includes(cleanTemp)) {
        formsToSubmit.push(cleanTemp);
      }
    }

    if (formsToSubmit.length === 0) {
      showToast(lang === 'mr' ? "कृपया किमान एक फॉर्म क्रमांक प्रविष्ट करा." : "Please enter at least one form number.", 'error');
      return;
    }

    // Check duplicates across all forms
    const duplicates = formsToSubmit.filter(num => forms.some(f => f.formNumber === num));
    if (duplicates.length > 0) {
      showToast(
        lang === 'mr' 
          ? `फॉर्म क्रमांक ${duplicates.join(', ')} आधीच वाटप केला आहे!` 
          : `Form(s) ${duplicates.join(', ')} already distributed!`, 
        'error'
      );
      return;
    }

    const newRecords: FormRecord[] = [];
    const nowStr = new Date().toISOString();

    // Find linked voter
    let linkedVoterObj = voters.find(v => v.srNo === selectedVoterSrNo);
    if (!linkedVoterObj) {
      linkedVoterObj = voters.find(v => v.name.toLowerCase() === recipientName.trim().toLowerCase());
    }

    formsToSubmit.forEach((num, index) => {
      newRecords.push({
        id: `f-${Date.now()}-${index}`,
        formNumber: num,
        recipientName: recipientName.trim(),
        recipientMobile: recipientMobile.trim(),
        voterSrNo: linkedVoterObj ? linkedVoterObj.srNo : null,
        voterName: linkedVoterObj ? linkedVoterObj.name : null,
        status: 'Distributed',
        distributedAt: nowStr,
        collectedAt: null,
        notes: distNotes.trim() || undefined
      });
    });

    // Save
    const updatedForms = [...forms, ...newRecords];
    saveForms(updatedForms);

    // Update voters linked form info
    if (linkedVoterObj) {
      const updatedVoters = voters.map(v => {
        if (v.srNo === linkedVoterObj!.srNo) {
          const existing = v.linkedFormNo ? v.linkedFormNo.split(', ') : [];
          const combined = Array.from(new Set([...existing, ...formsToSubmit])).join(', ');
          return { ...v, linkedFormNo: combined };
        }
        return v;
      });
      saveVoters(updatedVoters);
    }

    showToast(
      lang === 'mr' 
        ? `${formsToSubmit.length} फॉर्म यशस्वीरित्या वाटप नोंदवले!` 
        : `${formsToSubmit.length} Form(s) successfully registered as distributed!`, 
      'success'
    );

    // Reset inputs
    setRecipientName('');
    setRecipientMobile('');
    setSelectedFormNumbers([]);
    setTempFormNumber('');
    setRangeStart('');
    setRangeEnd('');
    setDistNotes('');
    setSelectedVoterSrNo('');
    
    // Switch to search/collection tab
    setActiveTab('collection');
  };

  // Toggle collection status for a single form
  const toggleFormStatus = (formId: string) => {
    const updated = forms.map(f => {
      if (f.id === formId) {
        const isCollected = f.status === 'Collected';
        return {
          ...f,
          status: isCollected ? 'Distributed' as const : 'Collected' as const,
          collectedAt: isCollected ? null : new Date().toISOString()
        };
      }
      return f;
    });

    saveForms(updated);
    showToast(lang === 'mr' ? "फॉर्म स्थिती अद्यतनित केली!" : "Form status updated!", 'success');
  };

  // Mark all forms of a specific recipient (mobile number) as collected
  const collectAllByMobile = (mobile: string) => {
    const updated = forms.map(f => {
      if (f.recipientMobile === mobile && f.status === 'Distributed') {
        return {
          ...f,
          status: 'Collected' as const,
          collectedAt: new Date().toISOString()
        };
      }
      return f;
    });
    saveForms(updated);
    showToast(lang === 'mr' ? "सर्व संबंधित नातेवाईकांचे फॉर्म जमा झाले!" : "All associated relatives' forms marked as Collected!", 'success');
  };

  // Delete a distribution record
  const handleDeleteFormRecord = (formId: string) => {
    const record = forms.find(f => f.id === formId);
    if (!record) return;

    if (confirm(lang === 'mr' ? `फॉर्म क्र. ${record.formNumber} ची वाटप नोंदणी हटवायची का?` : `Do you want to delete distribution record for Form No. ${record.formNumber}?`)) {
      const updatedForms = forms.filter(f => f.id !== formId);
      saveForms(updatedForms);

      // Unlink voter
      if (record.voterSrNo) {
        const updatedVoters = voters.map(v => {
          if (v.srNo === record.voterSrNo) {
            return { ...v, linkedFormNo: null };
          }
          return v;
        });
        saveVoters(updatedVoters);
      }
      showToast(lang === 'mr' ? "नोंद हटवली!" : "Record deleted!", 'info');
    }
  };

  // Call Gemini AI server-side endpoint to parse the OCR voter list
  const handleParseOcr = async () => {
    if (!ocrText.trim()) {
      setOcrError(lang === 'mr' ? 'कृपया आधी ओसीआर केलेला मजकूर पेस्ट करा.' : 'Please paste OCRed text first.');
      return;
    }

    setIsParsingOcr(true);
    setOcrError('');

    try {
      const res = await fetch('/api/parse-yaadi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ocrText })
      });

      const data = await res.json();

      if (res.ok && data.success && Array.isArray(data.voters)) {
        // Merge or replace voters
        // For security and cleanliness, we merge by matching srNo to avoid duplicating existing entries
        const parsedVoters: Voter[] = data.voters;
        
        const mergedVoters = [...voters];
        parsedVoters.forEach(pv => {
          const existingIdx = mergedVoters.findIndex(v => v.srNo === pv.srNo);
          if (existingIdx > -1) {
            mergedVoters[existingIdx] = { ...mergedVoters[existingIdx], ...pv };
          } else {
            mergedVoters.push(pv);
          }
        });

        // Sort by srNo numerically if possible
        mergedVoters.sort((a, b) => {
          const numA = parseInt(a.srNo);
          const numB = parseInt(b.srNo);
          if (isNaN(numA) || isNaN(numB)) return a.srNo.localeCompare(b.srNo);
          return numA - numB;
        });

        saveVoters(mergedVoters);
        showToast(lang === 'mr' ? `${parsedVoters.length} मतदार यशस्वीरित्या आयात केले गेले!` : `${parsedVoters.length} voters imported successfully!`, 'success');
        setOcrText('');
        setShowOcrModal(false);
      } else {
        setOcrError(data.error || (lang === 'mr' ? 'डेटा प्रोसेसिंग अयशस्वी.' : 'Data parsing failed.'));
      }
    } catch (err: any) {
      console.error(err);
      setOcrError(lang === 'mr' ? 'सर्व्हरशी संपर्क साधताना त्रुटी आली. कृपया सेटिंग्ज तपासा.' : 'Server communication error. Please check configurations.');
    } finally {
      setIsParsingOcr(false);
    }
  };

  // Helper function to parse ranges and lists of serial numbers (e.g. "1-5, 10, 12")
  const parseRangesAndLists = (input: any): string[] => {
    if (input === null || input === undefined) return [];
    const str = String(input).trim();
    if (!str) return [];
    
    // Split by commas, full-width commas, semicolons, or vertical bars
    const parts = str.split(/[,，|;\n\r]/);
    const results: string[] = [];
    
    for (let part of parts) {
      part = part.trim();
      if (!part) continue;
      
      // Match ranges like "1-5", "1 - 5", "1 to 5", "1 ते 5" (Marathi range)
      const rangeMatch = part.match(/^(\d+)\s*[-–—toते]\s*(\d+)$/i);
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1], 10);
        const end = parseInt(rangeMatch[2], 10);
        const min = Math.min(start, end);
        const max = Math.max(start, end);
        // Safety check to prevent browser hanging on giant ranges
        if (max - min < 1000) {
          for (let i = min; i <= max; i++) {
            results.push(String(i));
          }
        } else {
          results.push(String(start));
          results.push(String(end));
        }
      } else {
        // Clean individual value
        const cleanVal = part.replace(/[^\w/]/g, '').trim();
        if (cleanVal) {
          results.push(cleanVal);
        }
      }
    }
    return results;
  };

  // Handle Voter List PDF / Image File changes
  const handleVoterFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVoterFile(file);
    setVoterFileError('');
    setOcrText(''); // Clear text when file is uploaded

    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setVoterFileBase64(evt.target.result as string);
        setVoterFileMimeType(file.type);
      }
    };
    reader.onerror = () => {
      setVoterFileError(lang === 'mr' ? 'फाईल वाचण्यात त्रुटी आली.' : 'Error reading file.');
    };
    reader.readAsDataURL(file);
  };

  // Call Gemini AI server-side endpoint to parse the uploaded PDF / Image file
  const handleParsePdfOrImage = async () => {
    if (!voterFileBase64) {
      setVoterFileError(lang === 'mr' ? 'कृपया आधी फाईल निवडा.' : 'Please select a file first.');
      return;
    }

    setIsParsingOcr(true);
    setVoterFileError('');

    try {
      const res = await fetch('/api/parse-yaadi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          fileBase64: voterFileBase64,
          mimeType: voterFileMimeType
        })
      });

      const data = await res.json();

      if (res.ok && data.success && Array.isArray(data.voters)) {
        const parsedVoters: Voter[] = data.voters;
        
        if (parsedVoters.length === 0) {
          setVoterFileError(lang === 'mr' ? 'फाईलमध्ये कोणतेही मतदार सापडले नाहीत. कृपया दुसरा फोटो/पीडीएफ निवडा.' : 'No voters found in the file. Please try another image/PDF.');
          setIsParsingOcr(false);
          return;
        }

        const mergedVoters = [...voters];
        parsedVoters.forEach(pv => {
          const existingIdx = mergedVoters.findIndex(v => v.srNo === pv.srNo);
          if (existingIdx > -1) {
            mergedVoters[existingIdx] = { ...mergedVoters[existingIdx], ...pv };
          } else {
            mergedVoters.push(pv);
          }
        });

        // Sort numerically
        mergedVoters.sort((a, b) => {
          const numA = parseInt(a.srNo);
          const numB = parseInt(b.srNo);
          if (isNaN(numA) || isNaN(numB)) return a.srNo.localeCompare(b.srNo);
          return numA - numB;
        });

        saveVoters(mergedVoters);
        showToast(
          lang === 'mr' 
            ? `${parsedVoters.length} मतदार पीडीएफमधून यशस्वीरित्या आयात केले गेले!` 
            : `${parsedVoters.length} voters successfully imported from document!`, 
          'success'
        );
        
        // Reset state and close modal
        setVoterFile(null);
        setVoterFileBase64('');
        setShowOcrModal(false);
      } else {
        setVoterFileError(data.error || (lang === 'mr' ? 'पीडीएफ डेटा प्रोसेसिंग अयशस्वी.' : 'PDF parsing failed.'));
      }
    } catch (err: any) {
      console.error(err);
      setVoterFileError(lang === 'mr' ? 'सर्व्हरशी संपर्क साधताना त्रुटी आली. कृपया फाईलचा आकार तपासा.' : 'Server communication error. Please check file size.');
    } finally {
      setIsParsingOcr(false);
    }
  };

  // Handle Excel file change for form distribution
  const handleExcelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFile(file);
    setExcelError('');
    setExcelPreviewRows([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet);

        if (json.length === 0) {
          setExcelError(lang === 'mr' ? 'निवडलेली फाईल रिकामी आहे.' : 'Selected file is empty.');
          return;
        }

        setExcelPreviewRows(json);
      } catch (err: any) {
        console.error(err);
        setExcelError(lang === 'mr' ? 'एक्सेल फाईल वाचण्यात अडचण आली. कृपया फाईलचे स्वरूप तपासा.' : 'Error reading excel file. Please check format.');
      }
    };
    reader.onerror = () => {
      setExcelError(lang === 'mr' ? 'फाईल उघडता आली नाही.' : 'Failed to read file.');
    };
    reader.readAsBinaryString(file);
  };

  // Process Excel data and update form distribution list
  const handleImportExcelDistribution = () => {
    if (excelPreviewRows.length === 0) {
      setExcelError(lang === 'mr' ? 'प्रोसेस करण्यासाठी कोणताही डेटा आढळला नाही.' : 'No data to process.');
      return;
    }

    setIsProcessingExcel(true);
    
    try {
      const firstRow = excelPreviewRows[0];
      const keys = Object.keys(firstRow);

      // Helper to find matching keys (fuzzy match)
      const findKey = (candidates: string[]) => {
        return keys.find(k => {
          const lowerK = k.toLowerCase().replace(/[\s_\-.]/g, '');
          return candidates.some(c => lowerK.includes(c) || c.includes(lowerK));
        });
      };

      // Explicitly match Voter Sr No column only if it mentions voter or yaadi or similar
      const voterSrNoKey = findKey(['votersr', 'voterid', 'voterserial', 'votersrno', 'voter_no', 'मतदारअनुक्रमांक', 'मतदारक्र']);
      const formNoKey = findKey(['form', 'formno', 'formnumber', 'फॉर्म', 'क्रमांक', 'नंबर']);
      const recipientNameKey = findKey(['recipient', 'acceptor', 'representative', 'name', 'नाव', 'घेणाऱ्याचेनाव']);
      const recipientMobileKey = findKey(['mobile', 'phone', 'contact', 'मोबाईल', 'फोन', 'संपर्क']);
      const statusKey = findKey(['status', 'state', 'collected', 'distributed', 'स्थिती', 'स्टेटस', 'नोंद']);

      if (!formNoKey) {
        setExcelError(
          lang === 'mr' 
            ? 'फॉर्म क्रमांक (Form No) असलेला कॉलम शोधता आला नाही. कृपया कॉलमचे नाव "Form No" किंवा "Form Number" किंवा "फॉर्म क्रमांक" ठेवा.' 
            : 'Could not automatically find "Form No" or "Form Number" column. Please check column headers in your file.'
        );
        setIsProcessingExcel(false);
        return;
      }

      const newRecords: FormRecord[] = [];
      const nowStr = new Date().toISOString();
      let updatedVoters = [...voters];
      let successCount = 0;

      excelPreviewRows.forEach((row, idx) => {
        // Find form numbers
        const rawFormNoVal = row[formNoKey || ''];
        if (rawFormNoVal === undefined || rawFormNoVal === null || String(rawFormNoVal).trim() === '') {
          return; // Skip rows with empty form numbers
        }

        // Split form numbers by any hyphens, commas, semicolons, whitespace, etc.
        const rawFormStr = String(rawFormNoVal).trim();
        const formNos: string[] = [];
        const parts = rawFormStr.split(/[-–—,，;|\s/]+/);
        parts.forEach(part => {
          const cleanVal = part.trim();
          if (cleanVal) {
            formNos.push(cleanVal);
          }
        });

        if (formNos.length === 0) {
          return;
        }

        // Recipient details
        const rowRecipientName = recipientNameKey ? String(row[recipientNameKey] || '').trim() : '';
        const rowRecipientMobile = recipientMobileKey ? String(row[recipientMobileKey] || '').trim().replace(/\D/g, '') : '';
        const rawStatusVal = statusKey ? String(row[statusKey] || '').toLowerCase() : '';

        let rowStatus: 'Distributed' | 'Collected' = 'Distributed';
        if (rawStatusVal.includes('collected') || rawStatusVal.includes('जमा') || rawStatusVal.includes('yes') || rawStatusVal.includes('done')) {
          rowStatus = 'Collected';
        }

        // Voter Sr Nos (optional)
        const rawSrNoVal = voterSrNoKey ? row[voterSrNoKey] : null;
        const voterSrNos = rawSrNoVal !== null && rawSrNoVal !== undefined ? parseRangesAndLists(rawSrNoVal) : [];

        // For each form number in this row, we create a separate entry
        formNos.forEach((assignedFormNumber, subIdx) => {
          // If a voter Sr No is available for this subIdx, or we use the first one if only one exists
          let voterSrNo: string | null = null;
          if (voterSrNos.length > 0) {
            if (subIdx < voterSrNos.length) {
              voterSrNo = voterSrNos[subIdx];
            } else {
              voterSrNo = voterSrNos[0]; // fallback to the first voter Sr No in the row
            }
          }

          const targetVoter = voterSrNo ? updatedVoters.find(v => v.srNo === voterSrNo) : null;
          const voterName = targetVoter ? targetVoter.name : null;

          // Skip if exact duplicate formNumber exists
          if (forms.some(f => f.formNumber === assignedFormNumber) || newRecords.some(r => r.formNumber === assignedFormNumber)) {
            return;
          }

          newRecords.push({
            id: `f-excel-${Date.now()}-${idx}-${subIdx}-${Math.random().toString(36).substr(2, 4)}`,
            formNumber: assignedFormNumber,
            recipientName: rowRecipientName || voterName || (lang === 'mr' ? 'स्वयं' : 'Self'),
            recipientMobile: rowRecipientMobile || '0000000000',
            voterSrNo: voterSrNo,
            voterName: voterName,
            status: rowStatus,
            distributedAt: nowStr,
            collectedAt: rowStatus === 'Collected' ? nowStr : null,
            notes: lang === 'mr' ? 'एक्सेल शीटद्वारे आयात केले' : 'Bulk imported via Excel Sheet'
          });

          if (targetVoter && voterSrNo) {
            updatedVoters = updatedVoters.map(v => {
              if (v.srNo === targetVoter.srNo) {
                const existing = v.linkedFormNo ? v.linkedFormNo.split(', ') : [];
                const combined = Array.from(new Set([...existing, assignedFormNumber])).join(', ');
                return { ...v, linkedFormNo: combined };
              }
              return v;
            });
          }
          successCount++;
        });
      });

      if (newRecords.length === 0) {
        setExcelError(
          lang === 'mr' 
            ? 'कोणताही नवीन फॉर्म रेकॉर्ड जोडला गेला नाही. सर्व फॉर्म आधीच जोडलेले असावेत.' 
            : 'No new form records were registered. All forms might already exist.'
        );
        setIsProcessingExcel(false);
        return;
      }

      const mergedForms = [...forms, ...newRecords];
      saveForms(mergedForms);
      saveVoters(updatedVoters);

      showToast(
        lang === 'mr' 
          ? `यशस्वीरित्या ${successCount} फॉर्म रेकॉर्ड्स आयात आणि अपडेट केले गेले!` 
          : `Successfully imported and registered ${successCount} form records!`,
        'success'
      );

      setExcelFile(null);
      setExcelPreviewRows([]);
      setDistributionInputMode('manual');

    } catch (err: any) {
      console.error(err);
      setExcelError(
        lang === 'mr' 
          ? `डेटा आयात करताना चूक झाली: ${err.message || err}` 
          : `Import error: ${err.message || err}`
      );
    } finally {
      setIsProcessingExcel(false);
    }
  };

  // Handle manual voter addition
  const handleAddManualVoter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVoterSrNo.trim() || !newVoterName.trim()) {
      showToast(lang === 'mr' ? "अनुक्रमांक आणि नाव आवश्यक आहे." : "Sr No and Name are required.", 'error');
      return;
    }

    const exists = voters.some(v => v.srNo === newVoterSrNo.trim());
    if (exists) {
      showToast(lang === 'mr' ? `अनुक्रमांक ${newVoterSrNo} आधीच यादीत उपलब्ध आहे!` : `Sr No ${newVoterSrNo} already exists in voter list!`, 'error');
      return;
    }

    const newV: Voter = {
      srNo: newVoterSrNo.trim(),
      name: newVoterName.trim(),
      epic: newVoterEpic.trim(),
      age: newVoterAge ? parseInt(newVoterAge) : null,
      gender: newVoterGender,
      houseNo: newVoterHouseNo.trim()
    };

    const updated = [...voters, newV].sort((a, b) => {
      const numA = parseInt(a.srNo);
      const numB = parseInt(b.srNo);
      if (isNaN(numA) || isNaN(numB)) return a.srNo.localeCompare(b.srNo);
      return numA - numB;
    });

    saveVoters(updated);
    showToast(lang === 'mr' ? "नवीन मतदार यादीत जोडला!" : "New voter added successfully!", 'success');
    
    // Reset manual form
    setNewVoterSrNo('');
    setNewVoterName('');
    setNewVoterEpic('');
    setNewVoterAge('');
    setNewVoterGender('Male');
    setNewVoterHouseNo('');
    setShowAddVoterModal(false);
  };

  // Delete voter
  const handleDeleteVoter = (srNo: string) => {
    if (confirm(lang === 'mr' ? `अनुक्रमांक ${srNo} चा मतदार यादीमधून काढून टाकायचा का?` : `Do you want to delete voter Sr No ${srNo} from your list?`)) {
      const updated = voters.filter(v => v.srNo !== srNo);
      saveVoters(updated);
      showToast(lang === 'mr' ? "मतदार हटवला!" : "Voter deleted!", 'info');
    }
  };

  // Link voter to another voter's family
  const handleConnectFamily = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkingVoter) return;

    const selectedTargetVoter = voters.find(v => v.srNo === selectedFamilyTargetSrNo);
    if (!selectedTargetVoter) {
      showToast(lang === 'mr' ? "कृपया जोडण्यासाठी मतदार निवडा." : "Please select a voter to connect with.", 'error');
      return;
    }

    if (selectedTargetVoter.srNo === linkingVoter.srNo) {
      showToast(lang === 'mr' ? "स्वतःशीच कुटुंब जोडता येत नाही!" : "Cannot link a voter to themselves!", 'error');
      return;
    }

    let finalFamilyId = selectedTargetVoter.familyId;
    let finalFamilyName = selectedTargetVoter.familyName;

    if (!finalFamilyId) {
      finalFamilyId = `fam-${Date.now()}`;
      const surName = selectedTargetVoter.name.split(' ')[0] || '';
      finalFamilyName = customFamilyName.trim() || (lang === 'mr' ? `${surName} कुटुंब` : `${surName} Family`);
    } else if (customFamilyName.trim()) {
      finalFamilyName = customFamilyName.trim();
    }

    const updatedVoters = voters.map(v => {
      if (v.srNo === selectedTargetVoter.srNo) {
        return {
          ...v,
          familyId: finalFamilyId,
          familyName: finalFamilyName || v.familyName
        };
      }
      if (v.srNo === linkingVoter.srNo) {
        return {
          ...v,
          familyId: finalFamilyId,
          familyName: finalFamilyName,
          houseNo: selectedTargetVoter.houseNo
        };
      }
      if (v.familyId === finalFamilyId && customFamilyName.trim()) {
        return {
          ...v,
          familyName: customFamilyName.trim()
        };
      }
      return v;
    });

    saveVoters(updatedVoters);
    showToast(
      lang === 'mr' 
        ? `${linkingVoter.name} यांना ${selectedTargetVoter.name} यांच्या कुटुंबाशी यशस्वीरित्या जोडले!` 
        : `Successfully connected ${linkingVoter.name} with ${selectedTargetVoter.name}'s family!`, 
      'success'
    );

    setShowLinkFamilyModal(false);
    setLinkingVoter(null);
    setSelectedFamilyTargetSrNo('');
    setCustomFamilyName('');
  };

  // Remove voter from family
  const handleDisconnectFromFamily = (srNo: string) => {
    const voter = voters.find(v => v.srNo === srNo);
    if (!voter) return;

    if (confirm(lang === 'mr' ? `${voter.name} यांना कुटुंबापासून विभक्त करायचे का?` : `Do you want to disconnect ${voter.name} from their family?`)) {
      const updatedVoters = voters.map(v => {
        if (v.srNo === srNo) {
          return {
            ...v,
            familyId: null,
            familyName: null
          };
        }
        return v;
      });
      saveVoters(updatedVoters);
      showToast(lang === 'mr' ? "कुटुंबापासून विभक्त केले!" : "Disconnected from family!", 'info');
    }
  };

  // Export to CSV Helper
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      showToast(lang === 'mr' ? 'निर्यात करण्यासाठी कोणताही डेटा नाही.' : 'No data available to export.', 'error');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(fieldName => {
          let val = row[fieldName] === null || row[fieldName] === undefined ? '' : row[fieldName];
          // Wrap string with comma in quotes
          if (typeof val === 'string' && (val.includes(',') || val.includes('\n') || val.includes('"'))) {
            val = `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        }).join(',')
      )
    ].join('\n');

    // Encode with UTF-8 BOM so MS Excel reads Marathi fonts properly!
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(lang === 'mr' ? 'अहवाल CSV फॉरमॅटमध्ये यशस्वी डाउनलोड झाला!' : 'Report downloaded successfully as Excel CSV!', 'success');
  };

  // Generate Reports
  const downloadFullDistributionCSV = () => {
    const exportData = forms.map(f => ({
      'Form Number (फॉर्म क्र)': f.formNumber,
      'Recipient Name (स्वीकारणाऱ्याचे नाव)': f.recipientName,
      'Mobile Number (मोबाईल)': f.recipientMobile,
      'Voter List Serial No (मतदार यादी अनुक्रमांक)': f.voterSrNo || 'N/A',
      'Voter Name (मतदाराचे नाव)': f.voterName || 'N/A',
      'Status (स्थिती)': f.status === 'Collected' ? (lang === 'mr' ? 'जमा झाले (Collected)' : 'Collected') : (lang === 'mr' ? 'प्रलंबित (Distributed)' : 'Distributed'),
      'Distribution Date (वाटप तारीख)': new Date(f.distributedAt).toLocaleString(),
      'Collection Date (जमा तारीख)': f.collectedAt ? new Date(f.collectedAt).toLocaleString() : 'N/A',
      'Notes (टीप)': f.notes || ''
    }));
    exportToCSV(exportData, 'BLO_SIR_Form_Distribution_Sheet');
  };

  const downloadPendingCallListCSV = () => {
    const pendingForms = forms.filter(f => f.status === 'Distributed');
    const exportData = pendingForms.map(f => ({
      'Recipient Name (नाव)': f.recipientName,
      'Mobile Number (मोबाईल)': f.recipientMobile,
      'Form Number (फॉर्म क्र)': f.formNumber,
      'Linked Voter SrNo (मतदार अनुक्रमांक)': f.voterSrNo || 'N/A',
      'Linked Voter Name (मतदाराचे नाव)': f.voterName || 'N/A',
      'Days Since Distribution (वाटपापासून दिवस)': Math.floor((Date.now() - new Date(f.distributedAt).getTime()) / (1000 * 60 * 60 * 24))
    }));
    exportToCSV(exportData, 'BLO_SIR_Pending_Call_List');
  };

  const downloadVoterStatusCSV = () => {
    const exportData = voters.map(v => {
      const linkedForm = forms.find(f => f.voterSrNo === v.srNo);
      return {
        'Sr No (यादी अनुक्रमांक)': v.srNo,
        'Voter Name (मतदाराचे नाव)': v.name,
        'EPIC Card No (ओळखपत्र क्र)': v.epic,
        'Age (वय)': v.age || '',
        'Gender (लिंग)': v.gender,
        'House No (घर क्र)': v.houseNo,
        'SIR Form Linked (लिंक केलेला फॉर्म)': v.linkedFormNo || 'N/A',
        'Form Status (फॉर्म स्थिती)': linkedForm ? (linkedForm.status === 'Collected' ? 'Collected (जमा)' : 'Distributed (वाटप)') : 'Not Distributed (वाटप नाही)'
      };
    });
    exportToCSV(exportData, 'BLO_Voters_SIR_Status_Report');
  };

  // Reset all application data
  const handleResetData = () => {
    if (confirm(t.resetConfirm[lang])) {
      localStorage.removeItem('blo_voters');
      localStorage.removeItem('blo_forms');
      setVoters(defaultVoters);
      setForms(defaultForms);
      showToast(lang === 'mr' ? "सर्व डेटा डीफॉल्ट वर रिसेट केला गेला!" : "All data reset to default!", 'info');
      setActiveTab('dashboard');
    }
  };

  // Download backup handler
  const handleDownloadBackup = () => {
    try {
      const backupData = {
        appName: "BLO_SIR_Form_Tracker",
        backupDate: new Date().toISOString(),
        voters: voters,
        forms: forms
      };
      
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", url);
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadAnchor.setAttribute("download", `BLO_SIR_Backup_${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);
      
      showToast(
        lang === 'mr' 
          ? "सिस्टीम बॅकअप यशस्वीरित्या डाउनलोड झाला!" 
          : "System backup downloaded successfully!", 
        'success'
      );
    } catch (err: any) {
      console.error(err);
      showToast(
        lang === 'mr' 
          ? "बॅकअप तयार करताना चूक झाली." 
          : "Error creating backup file.", 
        'error'
      );
    }
  };

  // Handle PWA App installation click
  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === 'accepted') {
          showToast(
            lang === 'mr' 
              ? "अँप इंस्टॉलेशन सुरू झाले!" 
              : "App installation started successfully!", 
            'success'
          );
        }
        setDeferredPrompt(null);
      });
    } else {
      // Show full installation instruction sheet/modal
      setShowInstallInstructions(true);
    }
  };

  // Handle Backup File selection and parsing
  const handleBackupFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setBackupFile(file);
    setBackupError('');
    setBackupPreview(null);
    setBackupParsedData(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);
        
        // Basic schema validation
        if (!parsed || typeof parsed !== 'object') {
          throw new Error(lang === 'mr' ? 'अवैध फाईल फॉरमॅट' : 'Invalid file format');
        }
        if (!Array.isArray(parsed.voters) && !Array.isArray(parsed.blo_voters)) {
          throw new Error(lang === 'mr' ? 'या फाईलमध्ये मतदार डेटा आढळला नाही.' : 'No voters data found in backup.');
        }

        const parsedVoters = parsed.voters || parsed.blo_voters || [];
        const parsedForms = parsed.forms || parsed.blo_forms || [];
        
        setBackupPreview({
          votersCount: parsedVoters.length,
          formsCount: parsedForms.length,
          date: parsed.backupDate || parsed.timestamp || new Date().toISOString()
        });
        setBackupParsedData({
          voters: parsedVoters,
          forms: parsedForms
        });
      } catch (err: any) {
        console.error(err);
        setBackupError(
          lang === 'mr' 
            ? "बॅकअप फाईल वाचता आली नाही. कृपया वैध .json बॅकअप फाईल निवडा." 
            : "Failed to read backup file. Please select a valid .json backup file."
        );
      }
    };
    reader.onerror = () => {
      setBackupError(lang === 'mr' ? "फाईल उघडताना त्रुटी आली." : "Error reading file.");
    };
    reader.readAsText(file);
  };

  // Apply restore logic
  const handleApplyRestore = () => {
    if (!backupParsedData) {
      setBackupError(lang === 'mr' ? "कृपया आधी फाईल निवडा आणि लोड करा." : "Please select and load a backup file first.");
      return;
    }

    try {
      const incomingVoters: Voter[] = backupParsedData.voters;
      const incomingForms: FormRecord[] = backupParsedData.forms;

      if (restoreMode === 'overwrite') {
        // Complete overwrite
        saveVoters(incomingVoters);
        saveForms(incomingForms);
        showToast(
          lang === 'mr' 
            ? "बॅकअप पूर्णपणे रिस्टोर केला गेला! सर्व जुना डेटा बदलला आहे." 
            : "Backup restored successfully! All existing data has been replaced.", 
          'success'
        );
      } else {
        // Safe Merge Mode
        // Merge voters based on srNo
        let mergedVoters = [...voters];
        incomingVoters.forEach(iv => {
          const idx = mergedVoters.findIndex(v => v.srNo === iv.srNo);
          if (idx > -1) {
            // Merge fields, priority to incoming backup fields if present
            mergedVoters[idx] = { ...mergedVoters[idx], ...iv };
          } else {
            mergedVoters.push(iv);
          }
        });
        // Sort merged voters numerically
        mergedVoters.sort((a, b) => {
          const numA = parseInt(a.srNo);
          const numB = parseInt(b.srNo);
          if (isNaN(numA) || isNaN(numB)) return a.srNo.localeCompare(b.srNo);
          return numA - numB;
        });

        // Merge forms based on id or formNumber
        let mergedForms = [...forms];
        incomingForms.forEach(ifm => {
          const idx = mergedForms.findIndex(f => f.id === ifm.id || f.formNumber === ifm.formNumber);
          if (idx > -1) {
            mergedForms[idx] = { ...mergedForms[idx], ...ifm };
          } else {
            mergedForms.push(ifm);
          }
        });

        saveVoters(mergedVoters);
        saveForms(mergedForms);
        showToast(
          lang === 'mr' 
            ? "डेटा यशस्वीरित्या मर्ज झाला! नवीन माहिती समाविष्ट केली गेली आहे." 
            : "Data successfully merged! Backup information has been integrated.", 
          'success'
        );
      }

      // Close modal and reset state
      setShowBackupModal(false);
      setBackupFile(null);
      setBackupPreview(null);
      setBackupParsedData(null);
    } catch (err: any) {
      console.error(err);
      setBackupError(
        lang === 'mr' 
          ? "बॅकअप लागू करताना त्रुटी आली: " + err.message 
          : "Error applying backup: " + err.message
      );
    }
  };

  return (
    <div id="app-root" className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col selection:bg-amber-100 selection:text-amber-900">
      
      {/* Toast Notification */}
      {toast && (
        <div id="toast-notif" className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl transition-all transform translate-y-0 duration-300 ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 
          toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      )}

      {/* Top Banner & Navigation Header */}
      <header id="app-header" className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-3 rounded-xl border border-white/20">
              <Layers className="w-8 h-8 text-amber-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{t.title[lang]}</h1>
                <span className="bg-amber-500/30 text-amber-200 border border-amber-300/30 text-xs px-2.5 py-0.5 rounded-full font-bold">BLO PORTAL</span>
              </div>
              <p className="text-xs md:text-sm text-amber-100/90 font-medium mt-1">{t.subtitle[lang]}</p>
            </div>
          </div>

          {/* Quick Buttons */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <button 
              id="lang-toggle-btn"
              onClick={() => setLang(lang === 'mr' ? 'en' : 'mr')}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer"
            >
              <Languages className="w-4 h-4 text-amber-200" />
              <span>{lang === 'mr' ? 'English' : 'मराठी'}</span>
            </button>

            {/* PWA App Install Button */}
            <button 
              id="pwa-install-header-btn"
              onClick={handleInstallClick}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 border border-emerald-500/50 px-3.5 py-2 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all text-white cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-200" />
              <span>{lang === 'mr' ? 'Install App' : 'अँप इंस्टॉल'}</span>
            </button>

            {/* AI OCR Trigger */}
            <button 
              id="ai-ocr-trigger-btn"
              onClick={() => setShowOcrModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-200 to-yellow-300 hover:from-amber-300 hover:to-yellow-400 text-slate-900 px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all border border-amber-100 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-800" />
              <span>{t.importOcrBtn[lang]}</span>
            </button>
          </div>
        </div>

        {/* Tab Selection Row */}
        <div className="bg-slate-900/40 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 overflow-x-auto">
            <nav id="app-nav-tabs" className="flex space-x-1 py-1.5 md:py-2 min-w-max">
              <button
                id="tab-dashboard"
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'dashboard' ? 'bg-white text-slate-900 shadow-sm' : 'text-amber-100 hover:text-white hover:bg-white/5'
                }`}
              >
                <Layers className="w-4 h-4" />
                {t.tabDashboard[lang]}
              </button>
              <button
                id="tab-distribution"
                onClick={() => setActiveTab('distribution')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'distribution' ? 'bg-white text-slate-900 shadow-sm' : 'text-amber-100 hover:text-white hover:bg-white/5'
                }`}
              >
                <Plus className="w-4 h-4" />
                {t.tabDistribution[lang]}
              </button>
              <button
                id="tab-collection"
                onClick={() => setActiveTab('collection')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'collection' ? 'bg-white text-slate-900 shadow-sm' : 'text-amber-100 hover:text-white hover:bg-white/5'
                }`}
              >
                <Search className="w-4 h-4" />
                {t.tabCollection[lang]}
                {metrics.totalPending > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1">
                    {metrics.totalPending}
                  </span>
                )}
              </button>
              <button
                id="tab-voters"
                onClick={() => setActiveTab('voters')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'voters' ? 'bg-white text-slate-900 shadow-sm' : 'text-amber-100 hover:text-white hover:bg-white/5'
                }`}
              >
                <Users className="w-4 h-4" />
                {t.tabVoters[lang]}
              </button>
              <button
                id="tab-reports"
                onClick={() => setActiveTab('reports')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'reports' ? 'bg-white text-slate-900 shadow-sm' : 'text-amber-100 hover:text-white hover:bg-white/5'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                {t.tabReports[lang]}
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="app-main" className="flex-grow max-w-7xl w-full mx-auto px-4 py-6">
        
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div id="tab-dashboard-view" className="space-y-6">
            
            {/* Bento Grid Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.totalVoters[lang]}</p>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-slate-950 mt-2">{metrics.totalVotersCount}</h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-amber-600 font-bold mt-4 bg-amber-50 px-2 py-1 rounded-md self-start">
                  <Users className="w-3.5 h-3.5" />
                  <span>{lang === 'mr' ? "डिजिटल मतदार" : "Digital Voters"}</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div>
                  <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider">{t.distributed[lang]}</p>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-indigo-950 mt-2">{metrics.totalDistributed}</h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-bold mt-4 bg-indigo-50 px-2 py-1 rounded-md self-start">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{lang === 'mr' ? "वाटप यशस्वी" : "Form Distributed"}</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">{t.collected[lang]}</p>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-emerald-950 mt-2">{metrics.totalCollected}</h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold mt-4 bg-emerald-50 px-2 py-1 rounded-md self-start">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{lang === 'mr' ? "संकलित जमा" : "Collected Back"}</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div>
                  <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">{t.pending[lang]}</p>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-rose-950 mt-2">{metrics.totalPending}</h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-rose-600 font-bold mt-4 bg-rose-50 px-2 py-1 rounded-md self-start">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{lang === 'mr' ? "जमा करणे प्रलंबित" : "Pending Return"}</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-5 rounded-2xl shadow-xs flex flex-col justify-between col-span-2 lg:col-span-1">
                <div>
                  <p className="text-xs font-bold text-amber-100 uppercase tracking-wider">{t.completionRate[lang]}</p>
                  <h3 className="text-3xl md:text-4xl font-black mt-2">{metrics.completionPercentage}%</h3>
                </div>
                <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden mt-4">
                  <div className="bg-white h-full transition-all duration-1000" style={{ width: `${metrics.completionPercentage}%` }}></div>
                </div>
              </div>

            </div>

            {/* Quick Actions and Help Info Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl mt-0.5">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-900 text-base">
                    {lang === 'mr' ? "महत्त्वाची टीप - नातेवाईक फॉर्म मॅनेजमेंट" : "Important Tip - Relatives Form Management"}
                  </h4>
                  <p className="text-amber-800 text-sm mt-1">
                    {lang === 'mr' ? 
                      "जर एखादा मतदार त्याच्या नातेवाईकांचेही फॉर्म घेऊन जात असेल, तर फॉर्म वाटप करताना त्यांचा मोबाईल नंबर एकच ठेवा. सर्व फॉर्म आपोआप एकाच मोबाईल नंबर खाली संकलित होतील." : 
                      "If a voter is taking forms for their relatives too, use the same recipient mobile number. All those forms will group under that mobile number automatically."}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('distribution')}
                className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>{lang === 'mr' ? "नवीन वाटप नोंदवा" : "Register Distribution"}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Dashboard Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Recent Active Forms List */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 lg:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-extrabold text-slate-950 text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-600" />
                    {lang === 'mr' ? "अलीकडील फॉर्म वाटप रेकॉर्ड्स" : "Recent Form Distribution Records"}
                  </h3>
                  <button 
                    onClick={() => setActiveTab('collection')}
                    className="text-amber-600 hover:text-amber-700 font-bold text-xs flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>{lang === 'mr' ? "सर्व पहा" : "View All"}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold text-xs uppercase bg-slate-50/50">
                        <th className="py-3 px-3">{t.formNo[lang]}</th>
                        <th className="py-3 px-3">{t.recipient[lang]}</th>
                        <th className="py-3 px-3">{t.voterLinked[lang]}</th>
                        <th className="py-3 px-3">{t.status[lang]}</th>
                        <th className="py-3 px-3 text-right">{t.action[lang]}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {forms.slice(-5).reverse().map(f => (
                        <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 px-3 font-mono font-bold text-slate-900 bg-slate-50 rounded-lg text-center w-16">{f.formNumber}</td>
                          <td className="py-3.5 px-3">
                            <div className="font-semibold text-slate-900">{f.recipientName}</div>
                            <div className="text-xs text-slate-500">{f.recipientMobile}</div>
                          </td>
                          <td className="py-3.5 px-3">
                            {f.voterName ? (
                              <div className="flex items-center gap-1.5">
                                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">Sr.{f.voterSrNo}</span>
                                <span className="text-slate-700 font-medium truncate max-w-[150px]">{f.voterName}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs italic">{lang === 'mr' ? "लिंक नाही" : "Not Linked"}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                              f.status === 'Collected' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${f.status === 'Collected' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                              {f.status === 'Collected' ? t.collected[lang] : t.distributed[lang]}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <button
                              onClick={() => toggleFormStatus(f.id)}
                              className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                f.status === 'Collected'
                                  ? 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                  : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-sm'
                              }`}
                              title={f.status === 'Collected' ? t.markAsDistributed[lang] : t.markAsCollected[lang]}
                            >
                              {f.status === 'Collected' ? <RotateCcw className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {forms.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                            {t.noRecords[lang]}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Relative grouping stats sidebar */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col">
                <h3 className="font-extrabold text-slate-950 text-lg mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-600" />
                  {lang === 'mr' ? "कुटुंब / संकलक यादी" : "Family / Recipient Groups"}
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  {lang === 'mr' ? "एकाच व्यक्तीने घेतलेल्या अनेक फॉर्म्सची मोबाईल नंबरनुसार विभागणी:" : "List of distinct people who took forms for relatives grouped by mobile:"}
                </p>

                <div className="space-y-3 overflow-y-auto max-h-[300px] flex-grow pr-1">
                  {Array.from(new Set(forms.map(f => f.recipientMobile))).map((mobile: string) => {
                    const recipientForms = forms.filter(f => f.recipientMobile === mobile);
                    const recipientName = recipientForms[0]?.recipientName;
                    const totalFormsCount = recipientForms.length;
                    const collectedFormsCount = recipientForms.filter(f => f.status === 'Collected').length;
                    const pendingFormsCount = totalFormsCount - collectedFormsCount;

                    return (
                      <div key={mobile} className="p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 transition-all">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{recipientName}</h4>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">{mobile}</p>
                          </div>
                          {pendingFormsCount > 0 && (
                            <button 
                              onClick={() => collectAllByMobile(mobile)}
                              className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded shadow-xs cursor-pointer whitespace-nowrap"
                            >
                              {lang === 'mr' ? "सर्व जमा" : "Collect All"}
                            </button>
                          )}
                        </div>

                        {/* Badges showing form numbers */}
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {recipientForms.map(rf => (
                            <span 
                              key={rf.id} 
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                                rf.status === 'Collected' 
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                  : 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse'
                              }`}
                            >
                              {rf.formNumber}
                            </span>
                          ))}
                        </div>

                        {/* Progress Indicator */}
                        <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-slate-500 border-t border-slate-100 pt-2">
                          <span>{lang === 'mr' ? "प्रगती" : "Progress"}</span>
                          <span className={pendingFormsCount === 0 ? "text-emerald-600" : "text-amber-600"}>
                            {collectedFormsCount} / {totalFormsCount} {lang === 'mr' ? "जमा" : "Collected"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {forms.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-sm">
                      {lang === 'mr' ? "कोणताही डेटा उपलब्ध नाही." : "No grouping data."}
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: DISTRIBUTION */}
        {activeTab === 'distribution' && (
          <div id="tab-distribution-view" className="max-w-2xl mx-auto px-1">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-6 py-5">
                <h3 className="font-extrabold text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-200" />
                  {t.distributionForm[lang]}
                </h3>
                <p className="text-xs text-amber-100 mt-1">
                  {lang === 'mr' 
                    ? "फक्त नाव, मोबाईल आणि फॉर्म नंबर्स टाकून जलद नोंदणी करा." 
                    : "Quickly register distribution with only Name, Mobile, and Form Numbers."}
                </p>
              </div>

              {/* Toggle Manual vs Excel upload */}
              <div className="border-b border-slate-200 bg-slate-50 p-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setDistributionInputMode('manual')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                    distributionInputMode === 'manual'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  ✍️ {lang === 'mr' ? "मॅन्युअल फॉर्म वाटप" : "Manual Single Entry"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDistributionInputMode('bulk');
                    setExcelError('');
                    setExcelPreviewRows([]);
                    setExcelFile(null);
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                    distributionInputMode === 'bulk'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  {lang === 'mr' ? "एक्सेल / गुगल शीट अपलोड" : "Excel / Sheet Upload"}
                </button>
              </div>

              {distributionInputMode === 'manual' ? (
                <form onSubmit={handleAddDistribution} className="p-5 md:p-6 space-y-6">
                
                {/* Recipient Details Block */}
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/60 space-y-4">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-600" />
                    {t.recipientDetails[lang]}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t.recipientNameLabel[lang]} <span className="text-red-500">*</span>
                      </label>
                      <input 
                        ref={recipientNameRef}
                        type="text" 
                        value={recipientName}
                        onChange={(e) => {
                          setRecipientName(e.target.value);
                          if (selectedVoterSrNo) setSelectedVoterSrNo('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            recipientMobileRef.current?.focus();
                          }
                        }}
                        placeholder={lang === 'mr' ? "उदा. सचिन सुखदेव पाटील" : "e.g. Sachin Sukhdev Patil"}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-semibold"
                        required
                        autoComplete="off"
                      />
                      
                      {/* Real-time Voter Autocomplete Suggestions */}
                      {suggestedVoters.length > 0 && (
                        <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-slate-100">
                          <div className="bg-slate-50 px-3 py-1 text-[10px] text-slate-500 font-bold">
                            {lang === 'mr' ? "मतदार यादी सुचवणी (टॅप करा):" : "Voter list suggestions (Tap to select):"}
                          </div>
                          {suggestedVoters.map(v => (
                            <button
                              key={v.srNo}
                              type="button"
                              onClick={() => {
                                setRecipientName(v.name);
                                setSelectedVoterSrNo(v.srNo);
                                showToast(
                                  lang === 'mr' 
                                    ? `मतदार Sr.${v.srNo} लिंक केला!` 
                                    : `Linked Voter Sr.${v.srNo}!`, 
                                  'success'
                                );
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-amber-50/50 text-slate-700 flex justify-between items-center transition-colors"
                            >
                              <span className="truncate">{v.name}</span>
                              <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0">
                                Sr. {v.srNo}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t.recipientMobileLabel[lang]} <span className="text-red-500">*</span>
                      </label>
                      <input 
                        ref={recipientMobileRef}
                        type="tel" 
                        maxLength={10}
                        value={recipientMobile}
                        onChange={(e) => setRecipientMobile(e.target.value.replace(/\D/g, ''))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            tempFormNumberRef.current?.focus();
                          }
                        }}
                        placeholder="e.g. 98XXXXXXXX"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-mono font-bold"
                        required
                      />
                      <p className="text-[10px] text-amber-800 font-medium mt-1 leading-relaxed">
                        {t.recipientMobileHint[lang]}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Selection Block */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-600" />
                    {lang === 'mr' ? "वाटप केलेले फॉर्म नंबर्स" : "Distributed Form Numbers"}
                  </h4>

                  {/* Mode Selector Toggle Row */}
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setFormInputMode('quick')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                        formInputMode === 'quick' 
                          ? 'bg-white text-slate-900 shadow-xs' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {lang === 'mr' ? "कीबोर्डने जोडा (Add Single)" : "Type Form No."}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormInputMode('range')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                        formInputMode === 'range' 
                          ? 'bg-white text-slate-900 shadow-xs' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {lang === 'mr' ? "मालिका बनवा (Add Range)" : "Form Range Series"}
                    </button>
                  </div>

                  {/* Input Fields based on Entry Type */}
                  {formInputMode === 'quick' ? (
                    <div className="bg-amber-50/30 p-4 rounded-2xl border border-amber-200/40 space-y-3">
                      <div className="flex gap-2">
                        <div className="relative flex-grow">
                          <input 
                            ref={tempFormNumberRef}
                            type="text" 
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={tempFormNumber}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val.endsWith(' ') || val.endsWith(',')) {
                                addFormNumberChip(val);
                              } else {
                                setTempFormNumber(val);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
                                e.preventDefault();
                                addFormNumberChip(tempFormNumber);
                              }
                            }}
                            placeholder={lang === 'mr' ? "उदा. ४५०१" : "e.g. 4501"}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-mono font-bold text-slate-900"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => addFormNumberChip(tempFormNumber)}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 rounded-xl text-xs flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>{lang === 'mr' ? "जोडा" : "Add"}</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {lang === 'mr' 
                          ? "💡 मोबाईल कीबोर्डवर नंबर टाईप करून 'Space' किंवा 'Enter' दाबा, फॉर्म स्वतःच जोडला जाईल." 
                          : "💡 Type a form number and press 'Space' or 'Enter' on mobile keypad to add instantly."}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-amber-50/30 p-4 rounded-2xl border border-amber-200/40 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                            {t.formStartLabel[lang]}
                          </label>
                          <input 
                            type="text" 
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={rangeStart}
                            onChange={(e) => setRangeStart(e.target.value.replace(/\D/g, ''))}
                            placeholder="4501"
                            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-mono font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                            {t.formEndLabel[lang]}
                          </label>
                          <input 
                            type="text" 
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={rangeEnd}
                            onChange={(e) => setRangeEnd(e.target.value.replace(/\D/g, ''))}
                            placeholder="4505"
                            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-mono font-bold text-slate-900"
                          />
                        </div>
                      </div>

                      {/* Display Range Preview */}
                      {rangeStart && rangeEnd && parseInt(rangeStart) <= parseInt(rangeEnd) && (
                        <div className="text-[11px] font-bold text-amber-800 bg-amber-100/40 px-3 py-1.5 rounded-lg border border-amber-200/30 text-center">
                          {lang === 'mr' 
                            ? `हे एकूण ${parseInt(rangeEnd) - parseInt(rangeStart) + 1} फॉर्म्स जोडेल (${rangeStart} ते ${rangeEnd})` 
                            : `This will generate ${parseInt(rangeEnd) - parseInt(rangeStart) + 1} forms (${rangeStart} to ${rangeEnd})`}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={generateAndAddRange}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{lang === 'mr' ? "मालिका जोडा (+ Add Range)" : "Generate & Add Range"}</span>
                      </button>
                    </div>
                  )}

                  {/* Registered/Selected Chips List */}
                  <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/40 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700">
                        {lang === 'mr' ? "जोडलेले फॉर्म क्रमांक:" : "Added Forms List:"}
                        <span className="ml-1 bg-amber-600 text-white text-[10px] px-2 py-0.5 rounded-full font-extrabold">
                          {selectedFormNumbers.length}
                        </span>
                      </span>
                      {selectedFormNumbers.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedFormNumbers([])}
                          className="text-[10px] text-red-600 hover:text-red-700 font-extrabold flex items-center gap-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{lang === 'mr' ? "सर्व काढा" : "Clear All"}</span>
                        </button>
                      )}
                    </div>

                    {selectedFormNumbers.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-xs font-semibold border-2 border-dashed border-slate-200 rounded-xl bg-white">
                        {lang === 'mr' 
                          ? "अद्याप कोणताही फॉर्म जोडलेला नाही. वरून फॉर्म नंबर टाका." 
                          : "No forms added yet. Enter form numbers above."}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto p-1 bg-white border border-slate-100 rounded-xl">
                        {selectedFormNumbers.map(num => (
                          <div 
                            key={num} 
                            className="flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200/60 pl-2.5 pr-0.5 py-1 rounded-lg font-mono font-extrabold text-xs select-none"
                          >
                            <span>{num}</span>
                            <button 
                              type="button" 
                              onClick={() => removeFormNumberChip(num)} 
                              className="p-0.5 text-amber-500 hover:text-rose-600 rounded-full hover:bg-amber-100 transition-colors w-6 h-6 flex items-center justify-center cursor-pointer"
                              title="Delete"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional notes/remarks */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.notesLabel[lang]}</label>
                  <input 
                    type="text" 
                    value={distNotes}
                    onChange={(e) => setDistNotes(e.target.value)}
                    placeholder={lang === 'mr' ? "उदा. नातेवाईकांसाठीही फॉर्म नेला" : "e.g. Also took forms for relatives"}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-medium text-slate-800"
                  />
                </div>

                <div className="border-t border-slate-100 pt-5 flex justify-end">
                  <button 
                    type="submit"
                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>{t.submitDistribution[lang]}</span>
                  </button>
                </div>

              </form>
              ) : (
                <div className="p-5 md:p-6 space-y-6">
                  <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/50 space-y-2">
                    <h4 className="font-extrabold text-amber-900 text-xs uppercase tracking-wider flex items-center gap-2">
                      <Info className="w-4 h-4 text-amber-600" />
                      {lang === 'mr' ? "एक्सेल अपलोड सूचना" : "Excel Bulk Upload Instructions"}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {lang === 'mr' 
                        ? "एक्सेल/गुगल शीटद्वारे फॉर्म वाटप माहिती अपलोड करा. फाईलमध्ये किमान 'Serial Number' (किंवा 'Sr No' / 'अनुक्रमांक') कॉलम असणे आवश्यक आहे." 
                        : "Upload your Form Distribution spreadsheet. Columns will be automatically matched. Ensure you have a 'Serial Number' or 'Sr No' column."}
                    </p>
                    <p className="text-xs text-slate-500 italic">
                      {lang === 'mr'
                        ? "टीप: जर एका मतदाराला एकापेक्षा जास्त फॉर्म दिले असतील किंवा एका रो मध्ये अनेक मतदार जोडायचे असतील, तर अनुक्रमांक कॉलममध्ये - (उदा. १-५) किंवा , (उदा. १२, १४) चा वापर करा."
                        : "Note: For multiple serial numbers or ranges in a single row, separate them using dashes '-' (e.g. 1-5) or commas ',' (e.g. 12, 14, 15)."}
                    </p>
                  </div>

                  {/* Drag and Drop Box */}
                  <div className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-2xl p-8 text-center transition-all bg-slate-50 hover:bg-amber-50/5 relative cursor-pointer group">
                    <input 
                      type="file" 
                      accept=".xlsx,.xls,.csv" 
                      onChange={handleExcelFileChange}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      disabled={isProcessingExcel}
                    />
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="p-3 bg-white border border-slate-200 text-slate-700 rounded-xl group-hover:text-amber-600 group-hover:scale-105 transition-all shadow-xs">
                        <FileSpreadsheet className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-extrabold text-slate-900">
                          {excelFile ? excelFile.name : (lang === 'mr' ? "एक्सेल फाईल निवडा किंवा ड्रॅग करा" : "Click to select or drag and drop spreadsheet")}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold">
                          {excelFile ? `${(excelFile.size / 1024).toFixed(1)} KB • Excel/CSV` : (lang === 'mr' ? "सपोर्टेड: .xlsx, .xls, .csv फाईल्स" : "Accepts .xlsx, .xls, .csv spreadsheets")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {excelError && (
                    <div className="bg-red-50 text-red-800 p-3.5 rounded-xl border border-red-200 text-xs font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{excelError}</span>
                    </div>
                  )}

                  {/* Preview Table of Excel Rows */}
                  {excelPreviewRows.length > 0 && (
                    <div className="space-y-3">
                      <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-slate-500 flex items-center justify-between">
                        <span>{lang === 'mr' ? `फाईल पुनरावलोकन (एकूण ${excelPreviewRows.length} ओळी)` : `File Preview (${excelPreviewRows.length} rows found)`}</span>
                        <span className="text-[10px] text-slate-400 normal-case">{lang === 'mr' ? "पहिले ५ रेकॉर्ड दाखवले जात आहेत" : "Showing first 5 rows"}</span>
                      </h5>

                      <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500">
                              {Object.keys(excelPreviewRows[0]).map((key) => (
                                <th key={key} className="py-2.5 px-3 whitespace-nowrap">{key}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                            {excelPreviewRows.slice(0, 5).map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-slate-50/40">
                                {Object.values(row).map((val: any, cIdx) => (
                                  <td key={cIdx} className="py-2 px-3 whitespace-nowrap font-mono">{String(val || '')}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <button
                        type="button"
                        onClick={handleImportExcelDistribution}
                        disabled={isProcessingExcel}
                        className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {isProcessingExcel ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            <span>{lang === 'mr' ? "प्रोसेस करत आहे..." : "Processing & Importing..."}</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>{lang === 'mr' ? "वाटप मुख्य यादीमध्ये अपडेट करा" : "Import & Update Distribution Tracker"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: COLLECTION & SEARCH */}
        {activeTab === 'collection' && (
          <div id="tab-collection-view" className="space-y-6">
            
            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
              
              {/* Search input */}
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder[lang]}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-semibold"
                />
              </div>

              {/* Filters and Sorting Wrapper */}
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
                {/* Status Filters */}
                <div className="flex gap-2 overflow-x-auto shrink-0">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      statusFilter === 'all' 
                        ? 'bg-amber-600 text-white shadow-xs' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {lang === 'mr' ? "सर्व फॉर्म" : "All Forms"}
                  </button>
                  <button
                    onClick={() => setStatusFilter('Distributed')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      statusFilter === 'Distributed' 
                        ? 'bg-amber-600 text-white shadow-xs' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    {lang === 'mr' ? "प्रलंबित (Distributed)" : "Pending (Distributed)"}
                  </button>
                  <button
                    onClick={() => setStatusFilter('Collected')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      statusFilter === 'Collected' 
                        ? 'bg-amber-600 text-white shadow-xs' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    {lang === 'mr' ? "जमा (Collected)" : "Collected"}
                  </button>
                </div>

                {/* Sort Option Dropdown */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 shrink-0">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    {lang === 'mr' ? "क्रमवारी:" : "Sort:"}
                  </span>
                  <select
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(e.target.value as any)}
                    className="bg-transparent text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
                  >
                    <option value="form-asc">
                      {lang === 'mr' ? "लहान ते मोठे ↑" : "Form No: Low to High ↑"}
                    </option>
                    <option value="form-desc">
                      {lang === 'mr' ? "मोठे ते लहान ↓" : "Form No: High to Low ↓"}
                    </option>
                    <option value="date-desc">
                      {lang === 'mr' ? "तारीख (नवीन आधी)" : "Date: Newest First"}
                    </option>
                    <option value="date-asc">
                      {lang === 'mr' ? "तारीख (जुने आधी)" : "Date: Oldest First"}
                    </option>
                  </select>
                </div>
              </div>

            </div>

            {/* List of Form Records */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold text-xs uppercase bg-slate-50/70 select-none">
                      <th 
                        className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors group"
                        onClick={() => {
                          setFormSortOrder(prev => prev === 'form-asc' ? 'form-desc' : 'form-asc');
                        }}
                        title={lang === 'mr' ? "फॉर्म नंबरनुसार क्रमवारी बदला" : "Click to toggle Form No. sorting"}
                      >
                        <div className="flex items-center gap-1">
                          <span>{t.formNo[lang]}</span>
                          {formSortOrder === 'form-asc' && <span className="text-[10px] text-amber-600 font-extrabold">▲</span>}
                          {formSortOrder === 'form-desc' && <span className="text-[10px] text-amber-600 font-extrabold">▼</span>}
                          {formSortOrder !== 'form-asc' && formSortOrder !== 'form-desc' && (
                            <span className="text-[10px] text-slate-300 group-hover:text-amber-500 font-extrabold">⇅</span>
                          )}
                        </div>
                      </th>
                      <th className="py-3 px-4">{t.recipient[lang]}</th>
                      <th className="py-3 px-4">{t.voterLinked[lang]}</th>
                      <th className="py-3 px-4">{t.status[lang]}</th>
                      <th className="py-3 px-4">{lang === 'mr' ? "वाटप दिनांक" : "Distributed Date"}</th>
                      <th className="py-3 px-4 text-right">{t.action[lang]}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredForms.map(f => {
                      // Find how many pending forms this mobile has
                      const recipientForms = forms.filter(rf => rf.recipientMobile === f.recipientMobile);
                      const totalCount = recipientForms.length;
                      const collectedCount = recipientForms.filter(rf => rf.status === 'Collected').length;
                      const hasPendingRelatives = totalCount > collectedCount;

                      return (
                        <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-4 font-mono font-extrabold text-slate-900">
                            <span className="bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg">
                              {f.formNumber}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-bold text-slate-900">{f.recipientName}</div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">{f.recipientMobile}</div>
                            {f.notes && (
                              <div className="text-[11px] text-slate-400 mt-1 max-w-[200px] truncate" title={f.notes}>
                                * {f.notes}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {f.voterName ? (
                              <div className="flex items-center gap-1.5">
                                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-1.5 py-0.5 rounded">Sr.{f.voterSrNo}</span>
                                <span className="text-slate-800 font-semibold">{f.voterName}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs italic">{lang === 'mr' ? "लिंक नाही" : "Not Linked"}</span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-1">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold w-max ${
                                f.status === 'Collected' 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${f.status === 'Collected' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                {f.status === 'Collected' ? t.collected[lang] : t.distributed[lang]}
                              </span>
                              {f.collectedAt && (
                                <span className="text-[10px] text-slate-400">
                                  {lang === 'mr' ? "जमा:" : "Collected:"} {new Date(f.collectedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-slate-600 font-medium">
                            {new Date(f.distributedAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Group Action: Collect All Relatives forms if pending */}
                              {f.status === 'Distributed' && totalCount > 1 && hasPendingRelatives && (
                                <button
                                  onClick={() => collectAllByMobile(f.recipientMobile)}
                                  className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                                  title={t.collectAll[lang]}
                                >
                                  <Users className="w-3.5 h-3.5" />
                                  <span>{lang === 'mr' ? "कुटुंबाचे सर्व जमा" : "Collect Family"}</span>
                                </button>
                              )}

                              <button
                                onClick={() => toggleFormStatus(f.id)}
                                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                  f.status === 'Collected'
                                    ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                    : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-sm'
                                }`}
                              >
                                {f.status === 'Collected' ? (
                                  <>
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>{lang === 'mr' ? "पुन्हा वाटप" : "Revert"}</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>{lang === 'mr' ? "जमा करा" : "Collect"}</span>
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => handleDeleteFormRecord(f.id)}
                                className="p-1.5 rounded-xl border border-rose-100 text-rose-500 hover:bg-rose-50 transition-all cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredForms.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                          {t.noRecords[lang]}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: VOTER LIST (YAADI) */}
        {activeTab === 'voters' && (
          <div id="tab-voters-view" className="space-y-6">
            
            {/* Active Family Filter Alert Banner */}
            {selectedFamilyFilter && (
              <div className="bg-amber-50 border border-amber-200 text-amber-950 rounded-2xl px-5 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                    <Users className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-amber-900">
                      {lang === 'mr' ? "कुटुंब गट फिल्टर सक्रिय आहे" : "Family / Household Filter Active"}
                    </h4>
                    <p className="text-xs text-amber-700 mt-0.5">
                      {lang === 'mr' 
                        ? `फक्त निवडलेल्या कुटुंबातील सदस्य दाखवत आहे (कुटुंब कोड/घर क्र.: ${selectedFamilyFilter})` 
                        : `Showing only members belonging to this household (Family ID/House No.: ${selectedFamilyFilter})`}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedFamilyFilter(null)}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  {lang === 'mr' ? "सर्व मतदार दाखवा" : "Show All Voters"}
                </button>
              </div>
            )}

            {/* Header with Search, Toggle and Manual add buttons */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row gap-4 items-center justify-between">
              
              {/* Search and Grouping toggle */}
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:max-w-2xl">
                {/* Search Input */}
                <div className="relative flex-grow">
                  <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={voterSearchQuery}
                    onChange={(e) => setVoterSearchQuery(e.target.value)}
                    placeholder={t.voterSearchPlaceholder[lang]}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-semibold"
                  />
                </div>

                {/* Family Grouping Toggle */}
                <button
                  type="button"
                  onClick={() => setGroupByFamily(!groupByFamily)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 border shrink-0 ${
                    groupByFamily 
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm' 
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>{lang === 'mr' ? "कुटुंबानुसार गट पहा" : "Group by Family"}</span>
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-2 w-full lg:w-auto justify-end">
                <button
                  onClick={() => setShowAddVoterModal(true)}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/80 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{t.addVoterBtn[lang]}</span>
                </button>
                <button
                  onClick={() => setShowOcrModal(true)}
                  className="bg-slate-900 hover:bg-slate-850 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{lang === 'mr' ? "OCR मतदार यादी अपलोड (AI)" : "Upload OCR Yaadi (AI)"}</span>
                </button>
              </div>

            </div>

            {/* Voter Grouped List or Flat Table */}
            {groupByFamily ? (
              <div className="space-y-6">
                {groupedVoters?.map(group => (
                  <div key={group.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden hover:shadow-md transition-shadow">
                    
                    {/* Family Header */}
                    <div className="bg-slate-50/80 border-b border-slate-200 px-5 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                            <Users className="w-4 h-4" />
                          </span>
                          <h4 className="font-extrabold text-slate-800 text-sm md:text-base">
                            {group.name}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 font-semibold">
                          {lang === 'mr' 
                            ? `घर क्रमांक: ${group.houseNo || '—'} • एकूण मतदार: ${group.members.length}` 
                            : `House No: ${group.houseNo || '—'} • Total Voters: ${group.members.length}`}
                        </p>
                      </div>
                      
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => setSelectedFamilyFilter(group.id.startsWith('house-') ? group.houseNo : group.id)}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 flex-grow sm:flex-grow-0"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{lang === 'mr' ? "कुटुंब फिल्टर करा" : "Filter Family"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Table inside Family Group */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-bold text-[11px] uppercase bg-slate-50/30">
                            <th className="py-2.5 px-5 w-24 text-center">{t.srNoCol[lang]}</th>
                            <th className="py-2.5 px-4">{t.voterNameCol[lang]}</th>
                            <th className="py-2.5 px-4">{t.epicCol[lang]}</th>
                            <th className="py-2.5 px-4 w-32">{t.ageGenderCol[lang]}</th>
                            <th className="py-2.5 px-4">{t.formStatusCol[lang]}</th>
                            <th className="py-2.5 px-5 text-right w-56">{lang === 'mr' ? "पर्याय" : "Actions"}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {group.members.map(v => {
                            const linkedForm = forms.find(f => f.voterSrNo === v.srNo);

                            return (
                              <tr key={v.srNo} className="hover:bg-slate-50/20 transition-colors">
                                <td className="py-3 px-5 text-center">
                                  <span className="font-mono font-extrabold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                                    {v.srNo}
                                  </span>
                                </td>
                                <td className="py-3 px-4 font-bold text-slate-900">
                                  {v.name}
                                </td>
                                <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-500">
                                  {v.epic || '—'}
                                </td>
                                <td className="py-3 px-4 font-medium text-slate-700">
                                  <div className="flex flex-col">
                                    <span>{v.age ? `${v.age} Yrs` : '—'}</span>
                                    <span className="text-xs text-slate-400">
                                      {v.gender === 'Male' ? (lang === 'mr' ? 'पुरुष (Male)' : 'Male') : 
                                       v.gender === 'Female' ? (lang === 'mr' ? 'महिला (Female)' : 'Female') : 'Other'}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  {linkedForm ? (
                                    <div className="flex flex-col gap-0.5">
                                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold w-max border ${
                                        linkedForm.status === 'Collected' 
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                          : 'bg-amber-50 text-amber-700 border-amber-200'
                                      }`}>
                                        {linkedForm.status === 'Collected' ? t.collected[lang] : t.distributed[lang]}
                                      </span>
                                      <span className="text-[10px] text-slate-500 font-mono font-bold">
                                        {t.formNo[lang]} {linkedForm.formNumber}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-400 border border-slate-200">
                                      {t.notDistributed[lang]}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-5 text-right space-x-1 whitespace-nowrap">
                                  <button
                                    onClick={() => {
                                      setLinkingVoter(v);
                                      setSelectedFamilyTargetSrNo('');
                                      setFamilySearchQuery('');
                                      setCustomFamilyName(v.familyName || '');
                                      setShowLinkFamilyModal(true);
                                    }}
                                    className="text-amber-700 hover:bg-amber-50 border border-amber-100 hover:border-amber-200 px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer inline-flex items-center gap-1"
                                    title={lang === 'mr' ? "कुटुंबाशी जोडा" : "Link Family"}
                                  >
                                    <Link2 className="w-3 h-3" />
                                    <span>{lang === 'mr' ? 'लिंक' : 'Link'}</span>
                                  </button>
                                  {v.familyId && (
                                    <button
                                      onClick={() => handleDisconnectFromFamily(v.srNo)}
                                      className="text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer inline-flex items-center gap-1 bg-red-50"
                                      title={lang === 'mr' ? "कुटुंबापासून विभक्त करा" : "Disconnect / Unlink Family"}
                                    >
                                      <Unlink className="w-3 h-3" />
                                      <span>{lang === 'mr' ? 'विभक्त करा' : 'Unlink'}</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteVoter(v.srNo)}
                                    className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                                    title="Delete Voter"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                  </div>
                ))}

                {groupedVoters?.length === 0 && (
                  <div className="bg-white p-12 text-center text-slate-400 rounded-2xl border border-slate-200 font-medium">
                    {t.noRecords[lang]}
                  </div>
                )}
              </div>
            ) : (
              /* Flat Voter Table view */
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold text-xs uppercase bg-slate-50/70">
                        <th className="py-3.5 px-4 w-24 text-center">{t.srNoCol[lang]}</th>
                        <th className="py-3.5 px-4">{t.voterNameCol[lang]}</th>
                        <th className="py-3.5 px-4">{t.epicCol[lang]}</th>
                        <th className="py-3.5 px-4 w-32">{t.ageGenderCol[lang]}</th>
                        <th className="py-3.5 px-4 w-28">{t.houseNoCol[lang]}</th>
                        <th className="py-3.5 px-4">{t.formStatusCol[lang]}</th>
                        <th className="py-3.5 px-4 text-right w-60">{lang === 'mr' ? "कुटुंब नियंत्रण आणि पर्याय" : "Family Controls & Actions"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredVoters.map(v => {
                        const linkedForm = forms.find(f => f.voterSrNo === v.srNo);

                        return (
                          <tr key={v.srNo} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3.5 px-4 text-center">
                              <span className="font-mono font-extrabold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                                {v.srNo}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900">{v.name}</div>
                              {v.familyName && (
                                <div className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md font-bold mt-1 w-max flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  <span>{v.familyName}</span>
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-500">
                              {v.epic || '—'}
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-700">
                              <div className="flex flex-col">
                                <span>{v.age ? `${v.age} Yrs` : '—'}</span>
                                <span className="text-xs text-slate-400">
                                  {v.gender === 'Male' ? (lang === 'mr' ? 'पुरुष (Male)' : 'Male') : 
                                   v.gender === 'Female' ? (lang === 'mr' ? 'महिला (Female)' : 'Female') : 'Other'}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-600">
                              {v.houseNo || '—'}
                            </td>
                            <td className="py-3.5 px-4">
                              {linkedForm ? (
                                <div className="flex flex-col gap-1">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold w-max border ${
                                    linkedForm.status === 'Collected' 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                      : 'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}>
                                    {linkedForm.status === 'Collected' ? t.collected[lang] : t.distributed[lang]}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono font-bold">
                                    {t.formNo[lang]} {linkedForm.formNumber}
                                  </span>
                                </div>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-50 text-slate-400 border border-slate-200">
                                  {t.notDistributed[lang]}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                              <button
                                onClick={() => setSelectedFamilyFilter(v.familyId || v.houseNo)}
                                className="text-amber-700 hover:bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer inline-flex items-center gap-1"
                                title={lang === 'mr' ? "कुटुंबातील इतर सदस्य पहा" : "View Family Together"}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{lang === 'mr' ? "कुटुंब पहा" : "View Family"}</span>
                              </button>
                              
                              <button
                                onClick={() => {
                                  setLinkingVoter(v);
                                  setSelectedFamilyTargetSrNo('');
                                  setFamilySearchQuery('');
                                  setCustomFamilyName(v.familyName || '');
                                  setShowLinkFamilyModal(true);
                                }}
                                className="text-slate-600 hover:bg-slate-100 border border-slate-200 px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                                title={lang === 'mr' ? "कुटुंबाशी जोडा" : "Connect with Family"}
                              >
                                <Link2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{v.familyId ? (lang === 'mr' ? "कुटुंब बदला" : "Edit Fam") : (lang === 'mr' ? "कुटुंब जोडा" : "Link Fam")}</span>
                              </button>

                              {v.familyId && (
                                <button
                                  onClick={() => handleDisconnectFromFamily(v.srNo)}
                                  className="text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 px-2.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer inline-flex items-center gap-1 bg-red-50"
                                  title={lang === 'mr' ? "कुटुंबापासून विभक्त करा" : "Disconnect / Unlink Family"}
                                >
                                  <Unlink className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">{lang === 'mr' ? 'विभक्त करा' : 'Unlink'}</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteVoter(v.srNo)}
                                className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                                title="Delete Voter"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredVoters.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                            {t.noRecords[lang]}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 5: REPORTS & EXPORT */}
        {activeTab === 'reports' && (
          <div id="tab-reports-view" className="space-y-6">
            
            {/* Download Grid Panel */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div>
                <h3 className="font-extrabold text-slate-950 text-lg flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-amber-600" />
                  {lang === 'mr' ? "प्रशासकीय अहवाल आणि फाईल डाउनलोड" : "Administrative Reports & Downloads"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {lang === 'mr' ? "नायब तहसीलदार किंवा निवडणूक कार्यालयाला सुपूर्द करण्यासाठी आवश्यक एक्सेल कॉलिंग शीट्स आणि अहवाल डाउनलोड करा." : "Download Excel/CSV formatted spreadsheets to directly submit to Election Officers (ARO/Nayab Tahsildar)."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Card 1 */}
                <div className="border border-slate-200 hover:border-amber-300/60 p-5 rounded-2xl bg-slate-50 hover:bg-amber-50/20 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl w-max">
                      <Download className="w-5 h-5" />
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-base">{lang === 'mr' ? "वाटप व जमा मुख्य यादी" : "Full Distribution Tracker"}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {lang === 'mr' ? "वितरित आणि संकलित केलेल्या सर्व फॉर्मची सविस्तर माहिती स्वीकारणाऱ्याचे नाव आणि मोबाईल नंबरसह." : "Details of all SIR forms distributed, with recipient names, mobiles, linking dates, and collection timestamps."}
                    </p>
                  </div>
                  <button
                    onClick={downloadFullDistributionCSV}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t.downloadFullReport[lang]}</span>
                  </button>
                </div>

                {/* Card 2 */}
                <div className="border border-slate-200 hover:border-amber-300/60 p-5 rounded-2xl bg-slate-50 hover:bg-amber-50/20 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl w-max">
                      <Clock className="w-5 h-5" />
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-base">{lang === 'mr' ? "प्रलंबित कॉलिंग लिस्ट" : "Pending Call List"}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {lang === 'mr' ? "अद्याप जमा न झालेल्या फॉर्म्सची आणि मतदारांची मोबाईल नंबर्ससह यादी जेणेकरून त्यांना संपर्क करून फॉर्म आणण्यास सांगता येईल." : "List of pending distributed forms and voter contact numbers to easily filter, contact, and collect."}
                    </p>
                  </div>
                  <button
                    onClick={downloadPendingCallListCSV}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t.downloadPendingReport[lang]}</span>
                  </button>
                </div>

                {/* Card 3 */}
                <div className="border border-slate-200 hover:border-amber-300/60 p-5 rounded-2xl bg-slate-50 hover:bg-amber-50/20 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl w-max">
                      <Users className="w-5 h-5" />
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-base">{lang === 'mr' ? "संपूर्ण मतदार अहवाल" : "Complete Voter Report"}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {lang === 'mr' ? "तुमच्या मतदार यादीतील सर्व लोकांची आणि त्यांच्याशी लिंक झालेल्या फॉर्मची स्थिती दर्शवणारा एकत्रित अहवाल." : "Comprehensive status of all registered voters in your polling booth list and their associated SIR form status."}
                    </p>
                  </div>
                  <button
                    onClick={downloadVoterStatusCSV}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t.downloadVotersReport[lang]}</span>
                  </button>
                </div>

              </div>
            </div>

            {/* Backup & Restore Panel */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div>
                <h3 className="font-extrabold text-slate-950 text-lg flex items-center gap-2">
                  <Database className="w-5 h-5 text-amber-600" />
                  {lang === 'mr' ? "डेटा बॅकअप आणि सुरक्षितता" : "Data Backup & Security"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {lang === 'mr' 
                    ? "तुमचा सर्व डेटा (मतदार यादी आणि फॉर्म वाटपाची माहिती) सुरक्षित ठेवण्यासाठी बॅकअप घ्या किंवा जुना बॅकअप पुन्हा लागू करा." 
                    : "Save a local copy of your entire system's state or restore from an earlier backup to prevent any data loss."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Take Backup Card */}
                <div className="border border-slate-200 hover:border-amber-300/60 p-5 rounded-2xl bg-slate-50 hover:bg-amber-50/20 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="p-3 bg-amber-50 border border-amber-100 text-amber-700 rounded-xl w-max">
                      <Download className="w-5 h-5" />
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-base">
                      {lang === 'mr' ? "बॅकअप फाईल डाउनलोड करा" : "Download Backup File"}
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {lang === 'mr' 
                        ? "तुमच्या सर्व डिजिटल मतदारांचा आणि फॉर्म्सचा डेटा एका सुटसुटीत JSON फाईलमध्ये डाउनलोड करा. हा डेटा तुम्ही कधीही पुनर्स्थापित करू शकता." 
                        : "Download your entire digital voters and form distribution logs in a secure JSON file. You can load this file back any time."}
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadBackup}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                  >
                    <Download className="w-4 h-4" />
                    <span>{lang === 'mr' ? "बॅकअप डाउनलोड करा" : "Download Backup"}</span>
                  </button>
                </div>

                {/* Apply/Restore Backup Card */}
                <div className="border border-slate-200 hover:border-amber-300/60 p-5 rounded-2xl bg-slate-50 hover:bg-amber-50/20 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="p-3 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl w-max">
                      <Upload className="w-5 h-5" />
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-base">
                      {lang === 'mr' ? "बॅकअप फाईल लागू करा (रीस्टोर)" : "Restore from Backup"}
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {lang === 'mr' 
                        ? "पूर्वी डाऊनलोड केलेली बॅकअप फाईल (.json) निवडून सिस्टीममध्ये पुन्हा लोड करा. तुम्ही डेटा मर्ज करू शकता किंवा पूर्ण बदलू शकता." 
                        : "Load an earlier saved .json backup file back into the system. You can choose to merge or overwrite your current state."}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setBackupFile(null);
                      setBackupError('');
                      setBackupPreview(null);
                      setBackupParsedData(null);
                      setShowBackupModal(true);
                    }}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{lang === 'mr' ? "बॅकअप फाईल अपलोड करा" : "Upload Backup File"}</span>
                  </button>
                </div>

              </div>
            </div>

            {/* Clear Database Reset panel */}
            <div className="bg-red-50 border border-red-200 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 text-red-700 rounded-xl mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-red-900 text-base">
                    {lang === 'mr' ? "डेटा नियंत्रण - रिसेट" : "Danger Zone - Reset App Data"}
                  </h4>
                  <p className="text-red-700 text-sm mt-1">
                    {lang === 'mr' ? "हा पर्याय निवडल्यास तुमचे सर्व फॉर्म वाटप आणि मतदार रेकॉर्ड्स डिलीट होतील आणि ॲप डीफॉल्ट सेटिंग्जवर येईल. रिसेट करण्यापूर्वी बॅकअप नक्की डाउनलोड करा!" : "This action is irreversible. All your custom voters and distributed forms will be deleted permanently."}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleResetData}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.resetDataBtn[lang]}</span>
              </button>
            </div>

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer id="app-footer" className="bg-slate-900 text-slate-400 py-6 border-t border-slate-800 text-center text-xs mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-3">
          <p>© 2026 {t.title[lang]} — {lang === 'mr' ? "बी.एल.ओ. डिजिटल सहाय्यक प्रणाली" : "Booth Level Officer (BLO) Digital Assistant"}</p>
          <p className="text-[10px] text-slate-500 font-medium">
            Powered by Gemini AI Studio • Standard Election Duty Portal Maharashtra
          </p>
        </div>
      </footer>

      {/* MODAL: AI YAADI OCR IMPORT */}
      {showOcrModal && (
        <div id="ai-ocr-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs transition-all">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-base md:text-lg">
                  {lang === 'mr' ? "AI मतदार यादी डेटा आयात" : "AI Voter List Import"}
                </h3>
              </div>
              <button 
                onClick={() => { if (!isParsingOcr) setShowOcrModal(false); }}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-grow">
              
              {/* Segmented control for PDF/Image Upload vs Text Paste */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setOcrInputMode('file')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    ocrInputMode === 'file' 
                      ? 'bg-white text-slate-900 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  📁 {lang === 'mr' ? "पीडीएफ / फोटो फाईल अपलोड" : "PDF / Image File Upload"}
                </button>
                <button
                  type="button"
                  onClick={() => setOcrInputMode('text')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    ocrInputMode === 'text' 
                      ? 'bg-white text-slate-900 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  ✍️ {lang === 'mr' ? "मजकूर पेस्ट करा" : "Paste Text Copy"}
                </button>
              </div>

              {ocrInputMode === 'file' ? (
                <div className="space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed bg-amber-50/50 p-4 rounded-xl border border-amber-200/50">
                    {lang === 'mr' 
                      ? "निवडणूक आयोगाची मतदार यादी (Yaadi PDF) किंवा तिच्या पानाचा फोटो अपलोड करा. आमचे प्रगत AI मॉडेल मतदारांची माहिती स्वयंचलितपणे वाचून मुख्य यादीत अपडेट करेल." 
                      : "Upload an official Voter List PDF or a photo of a voter list page. Gemini AI will automatically extract and structure all voter records into your dashboard."}
                  </p>

                  <div className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-2xl p-8 text-center transition-all bg-slate-50 hover:bg-amber-50/5 relative cursor-pointer group">
                    <input 
                      type="file" 
                      accept="application/pdf,image/*" 
                      onChange={handleVoterFileChange}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      disabled={isParsingOcr}
                    />
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="p-3 bg-white border border-slate-200 text-slate-700 rounded-xl group-hover:text-amber-600 group-hover:scale-105 transition-all shadow-xs">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-extrabold text-slate-900">
                          {voterFile ? voterFile.name : (lang === 'mr' ? "फाईल निवडा किंवा येथे ड्रॅग करा" : "Click to select or drag and drop file")}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold">
                          {voterFile ? `${(voterFile.size / 1024 / 1024).toFixed(2)} MB • PDF or Image` : (lang === 'mr' ? "मर्यादा: ५ MB पर्यंत (Yaadi PDF, PNG, JPG)" : "Accepts official PDF, PNG, or JPEG up to 5MB")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {voterFileError && (
                    <div className="bg-red-50 text-red-800 p-3 rounded-xl border border-red-200 text-xs font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{voterFileError}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                    {t.ocrDescription[lang]}
                  </p>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {lang === 'mr' ? "मतदार यादीचा मजकूर पेस्ट करा:" : "Paste Voter List OCR Text:"}
                    </label>
                    <textarea
                      id="ocr-text-input"
                      rows={8}
                      value={ocrText}
                      onChange={(e) => setOcrText(e.target.value)}
                      placeholder={t.ocrTextareaPlaceholder[lang]}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs md:text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all text-slate-800"
                      disabled={isParsingOcr}
                    ></textarea>
                  </div>

                  {ocrError && (
                    <div className="bg-red-50 text-red-800 p-3 rounded-xl border border-red-200 text-xs font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{ocrError}</span>
                    </div>
                  )}
                </div>
              )}

            </div>

            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setVoterFile(null);
                  setVoterFileBase64('');
                  setVoterFileError('');
                  setOcrText('');
                  setOcrError('');
                  setShowOcrModal(false);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
                disabled={isParsingOcr}
              >
                {lang === 'mr' ? "बंद करा" : "Cancel"}
              </button>
              
              {ocrInputMode === 'file' ? (
                <button
                  onClick={handleParsePdfOrImage}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  disabled={isParsingOcr || !voterFileBase64}
                >
                  {isParsingOcr ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>{t.ocrProcessing[lang]}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                      <span>{lang === 'mr' ? "फाईल प्रोसेस करा (AI)" : "Analyze Document (AI)"}</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleParseOcr}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  disabled={isParsingOcr || !ocrText.trim()}
                >
                  {isParsingOcr ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>{t.ocrProcessing[lang]}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                      <span>{t.ocrSubmit[lang]}</span>
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* MODAL: ADD MANUAL VOTER */}
      {showAddVoterModal && (
        <div id="add-voter-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs transition-all">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-4 flex justify-between items-center">
              <h3 className="font-extrabold text-base">{t.addVoterBtn[lang]}</h3>
              <button 
                onClick={() => setShowAddVoterModal(false)}
                className="text-white/80 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddManualVoter} className="p-5 space-y-4">
              
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'mr' ? "अनुक्रमांक *" : "Sr No *"}</label>
                  <input 
                    type="text" 
                    value={newVoterSrNo}
                    onChange={(e) => setNewVoterSrNo(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-sm font-mono font-bold"
                    placeholder="9"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'mr' ? "मतदाराचे पूर्ण नाव *" : "Voter Full Name *"}</label>
                  <input 
                    type="text" 
                    value={newVoterName}
                    onChange={(e) => setNewVoterName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-sm font-semibold"
                    placeholder={lang === 'mr' ? "उदा. पाटील सुजित रामराव" : "e.g. Patil Sujit Ramrao"}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'mr' ? "वय" : "Age"}</label>
                  <input 
                    type="text" 
                    maxLength={3}
                    value={newVoterAge}
                    onChange={(e) => setNewVoterAge(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-sm font-semibold"
                    placeholder="25"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'mr' ? "लिंग" : "Gender"}</label>
                  <select 
                    value={newVoterGender}
                    onChange={(e) => setNewVoterGender(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-sm font-semibold"
                  >
                    <option value="Male">{lang === 'mr' ? "पुरुष (Male)" : "Male"}</option>
                    <option value="Female">{lang === 'mr' ? "महिला (Female)" : "Female"}</option>
                    <option value="Other">{lang === 'mr' ? "इतर (Other)" : "Other"}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'mr' ? "EPIC क्र. (कार्ड क्र.)" : "EPIC Card No."}</label>
                  <input 
                    type="text" 
                    value={newVoterEpic}
                    onChange={(e) => setNewVoterEpic(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-sm font-mono"
                    placeholder="XYZ1234567"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'mr' ? "घर क्रमांक" : "House No."}</label>
                  <input 
                    type="text" 
                    value={newVoterHouseNo}
                    onChange={(e) => setNewVoterHouseNo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-sm font-semibold"
                    placeholder="12/A"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddVoterModal(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  {lang === 'mr' ? "रद्द करा" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
                >
                  {lang === 'mr' ? "मतदार जतन करा" : "Save Voter"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONNECT / LINK FAMILY */}
      {showLinkFamilyModal && linkingVoter && (
        <div id="link-family-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs transition-all">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-200" />
                <h3 className="font-extrabold text-base">
                  {lang === 'mr' ? "कुटुंबाशी जोडा / लिंक करा" : "Connect with Family"}
                </h3>
              </div>
              <button 
                onClick={() => {
                  setShowLinkFamilyModal(false);
                  setLinkingVoter(null);
                }}
                className="text-white hover:text-slate-100 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConnectFamily} className="p-5 space-y-4">
              
              {/* Selected Voter Info */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">
                  {lang === 'mr' ? "निवडलेला मतदार (Voter)" : "Target Voter"}
                </span>
                <h4 className="font-bold text-slate-800 text-sm mt-0.5">{linkingVoter.name}</h4>
                <div className="text-xs text-slate-500 mt-1 flex gap-3">
                  <span>{lang === 'mr' ? `अनुक्रमांक: ${linkingVoter.srNo}` : `Sr No: ${linkingVoter.srNo}`}</span>
                  <span>{lang === 'mr' ? `घर क्र.: ${linkingVoter.houseNo || '—'}` : `House No: ${linkingVoter.houseNo || '—'}`}</span>
                </div>
              </div>

              {/* Target family search input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {lang === 'mr' ? "कुटुंबातील सदस्याचा अनुक्रमांक (Serial Number) किंवा नाव प्रविष्ट करा: *" : "Enter Family Member's Serial Number (Sr No) or Name: *"}
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={familySearchQuery}
                    onChange={(e) => setFamilySearchQuery(e.target.value)}
                    placeholder={lang === 'mr' ? "उदा. २ किंवा पाटील सचिन..." : "e.g. 2 or Patil Sachin..."}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-2 py-1.5 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>

                {/* Instant Exact Serial Number Lookup Card */}
                {(() => {
                  const queryTrimmed = familySearchQuery.trim();
                  if (!queryTrimmed) return null;
                  const matched = voters.find(
                    v => v.srNo === queryTrimmed && v.srNo !== linkingVoter.srNo
                  );
                  if (!matched) return null;
                  return (
                    <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl space-y-2 mt-2 shadow-sm animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md">
                          {lang === 'mr' ? "अनुक्रमांकानुसार मतदार सापडला!" : "Voter Found by Sr No!"}
                        </span>
                        <span className="font-mono font-black text-emerald-800 text-xs bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded-sm">
                          Sr. {matched.srNo}
                        </span>
                      </div>
                      <div className="font-black text-slate-900 text-sm md:text-base">
                        {matched.name}
                      </div>
                      <div className="text-xs text-slate-500 font-semibold flex flex-wrap gap-x-4 gap-y-1">
                        <span>EPIC: {matched.epic || '—'}</span>
                        <span>{lang === 'mr' ? `वय/लिंग: ${matched.age || '—'} / ${matched.gender === 'Male' ? 'पुरुष' : 'महिला'}` : `Age/Gender: ${matched.age || '—'} / ${matched.gender}`}</span>
                        <span>{lang === 'mr' ? `घर क्र: ${matched.houseNo || '—'}` : `House No: ${matched.houseNo || '—'}`}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFamilyTargetSrNo(matched.srNo);
                          setFamilySearchQuery(matched.name);
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Check className="w-4 h-4" />
                        <span>{lang === 'mr' ? `${matched.name} यांच्या कुटुंबाशी जोडा` : `Link with ${matched.name}'s Family`}</span>
                      </button>
                    </div>
                  );
                })()}
                
                {/* Search suggestions */}
                {familySearchQuery.trim().length > 0 && (
                  <div className="border border-slate-200 rounded-lg max-h-40 overflow-y-auto divide-y divide-slate-100 bg-white shadow-xs mt-1.5">
                    {voters
                      .filter(v => {
                        if (v.srNo === linkingVoter.srNo) return false;
                        const q = familySearchQuery.trim().toLowerCase();
                        return (
                          v.name.toLowerCase().includes(q) ||
                          v.srNo === q ||
                          (v.epic && v.epic.toLowerCase().includes(q))
                        );
                      })
                      .slice(0, 5)
                      .map(v => (
                        <button
                          key={v.srNo}
                          type="button"
                          onClick={() => {
                            setSelectedFamilyTargetSrNo(v.srNo);
                            setFamilySearchQuery(v.name);
                          }}
                          className={`w-full text-left p-2.5 hover:bg-slate-50 text-xs transition-colors flex justify-between items-center ${
                            selectedFamilyTargetSrNo === v.srNo ? 'bg-amber-50 font-bold text-amber-900' : 'text-slate-700'
                          }`}
                        >
                          <div>
                            <div className="font-extrabold text-slate-800">
                              <span className="font-mono bg-slate-100 px-1 rounded-sm text-slate-600 border border-slate-200 mr-1.5 text-[10px]">Sr.{v.srNo}</span>
                              {v.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Epic: {v.epic || '—'} • House: {v.houseNo || '—'}</div>
                          </div>
                          {selectedFamilyTargetSrNo === v.srNo && <Check className="w-4 h-4 text-amber-700" />}
                        </button>
                      ))}
                    {voters.filter(v => {
                      if (v.srNo === linkingVoter.srNo) return false;
                      const q = familySearchQuery.trim().toLowerCase();
                      return (
                        v.name.toLowerCase().includes(q) ||
                        v.srNo === q ||
                        (v.epic && v.epic.toLowerCase().includes(q))
                      );
                    }).length === 0 && (
                      <div className="p-3 text-center text-xs text-slate-400 font-semibold">
                        {lang === 'mr' ? "कोणताही मतदार सापडला नाही" : "No voter found"}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Target confirmation badge */}
              {selectedFamilyTargetSrNo && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center justify-between text-xs font-bold text-amber-950">
                  <div>
                    <span>{lang === 'mr' ? "जोडण्यासाठी निवडले:" : "Selected to link with:"}</span>
                    <div className="text-amber-900 font-black">{voters.find(v => v.srNo === selectedFamilyTargetSrNo)?.name}</div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSelectedFamilyTargetSrNo('')}
                    className="text-amber-700 hover:text-amber-900 font-extrabold"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Custom family label input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'mr' ? "कुटुंबाचे नाव (वैयक्तिक नाव) - पर्यायी:" : "Family Name (Optional):"}
                </label>
                <input 
                  type="text" 
                  value={customFamilyName}
                  onChange={(e) => setCustomFamilyName(e.target.value)}
                  placeholder={lang === 'mr' ? "उदा. पाटील सुखदेव परिवार" : "e.g. Patil Sukhdev Family"}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm font-semibold"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  {lang === 'mr' 
                    ? "* कुटुंब जोडल्यावर निवडलेल्या मतदाराचा घर क्रमांक देखील आपोआप सिंक केला जाईल." 
                    : "* Linking will also automatically synchronize house numbers for complete data accuracy."}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowLinkFamilyModal(false);
                    setLinkingVoter(null);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  {lang === 'mr' ? "रद्द करा" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={!selectedFamilyTargetSrNo}
                  className={`text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-all ${
                    selectedFamilyTargetSrNo 
                      ? 'bg-amber-600 hover:bg-amber-700' 
                      : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  {lang === 'mr' ? "कुटुंब लिंक करा" : "Connect Family"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: BACKUP & RESTORE */}
      {showBackupModal && (
        <div id="backup-restore-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs transition-all">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col">
            
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-base md:text-lg">
                  {lang === 'mr' ? "सिस्टीम डेटा रीस्टोर करा" : "Restore System Backup"}
                </h3>
              </div>
              <button 
                onClick={() => {
                  setShowBackupModal(false);
                  setBackupFile(null);
                  setBackupError('');
                  setBackupPreview(null);
                  setBackupParsedData(null);
                }}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 max-h-[80vh]">
              
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                {lang === 'mr' 
                  ? "पूर्वी डाउनलोड केलेली .json बॅकअप फाईल येथे अपलोड करा. फाईल मधील मतदार आणि फॉर्म वितरणाचा तपशील तपासला जाईल आणि त्यानंतर ॲपमध्ये लागू केला जाईल." 
                  : "Upload a previously downloaded .json backup file. The system will inspect the voter records and form logs before applying them."}
              </p>

              {/* File input box */}
              <div className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-2xl p-6 text-center transition-all bg-slate-50 hover:bg-amber-50/5 relative cursor-pointer group">
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleBackupFileChange}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="p-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl group-hover:text-amber-600 group-hover:scale-105 transition-all shadow-xs">
                    <Database className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-extrabold text-slate-900">
                      {backupFile ? backupFile.name : (lang === 'mr' ? "बॅकअप (.json) फाईल निवडा" : "Click to select backup (.json) file")}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      {backupFile ? `${(backupFile.size / 1024).toFixed(1)} KB` : (lang === 'mr' ? "फक्त .json फाईल्स स्वीकृत" : "Only JSON files generated by this system")}
                    </p>
                  </div>
                </div>
              </div>

              {backupError && (
                <div className="bg-red-50 text-red-800 p-3 rounded-xl border border-red-200 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{backupError}</span>
                </div>
              )}

              {/* Backup File Preview Stats */}
              {backupPreview && (
                <div className="bg-amber-50/40 border border-amber-200/60 rounded-xl p-4 space-y-3 font-sans">
                  <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">
                    📊 {lang === 'mr' ? "बॅकअप फाईल विश्लेषण:" : "Backup File Inspection:"}
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs font-sans">
                    <div className="bg-white border border-slate-100 p-2.5 rounded-lg text-center">
                      <span className="text-slate-400 block font-semibold text-[10px] uppercase tracking-wide">
                        {lang === 'mr' ? "एकूण मतदार" : "Total Voters"}
                      </span>
                      <strong className="text-slate-900 text-base font-black mt-1 block">{backupPreview.votersCount}</strong>
                    </div>
                    <div className="bg-white border border-slate-100 p-2.5 rounded-lg text-center">
                      <span className="text-slate-400 block font-semibold text-[10px] uppercase tracking-wide">
                        {lang === 'mr' ? "वितरित फॉर्म" : "Distributed Forms"}
                      </span>
                      <strong className="text-slate-900 text-base font-black mt-1 block">{backupPreview.formsCount}</strong>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 font-medium flex justify-between pt-1 border-t border-amber-200/50">
                    <span>{lang === 'mr' ? "तयार केल्याची तारीख:" : "Backup Created:"}</span>
                    <strong className="text-slate-700">{new Date(backupPreview.date).toLocaleString()}</strong>
                  </div>

                  {/* Mode options */}
                  <div className="space-y-2 pt-3 border-t border-amber-200/50">
                    <label className="block text-xs font-bold text-slate-800">
                      ⚙️ {lang === 'mr' ? "रीस्टोर करण्याची पद्धत निवडा:" : "Choose Restore Strategy:"}
                    </label>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRestoreMode('merge')}
                        className={`p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                          restoreMode === 'merge'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <div className="font-extrabold">{lang === 'mr' ? "मर्ज करा (Merge)" : "Merge Safely"}</div>
                        <div className={`text-[10px] mt-0.5 font-medium ${restoreMode === 'merge' ? 'text-amber-100' : 'text-slate-400'}`}>
                          {lang === 'mr' ? "सध्याचा डेटा सुरक्षित राहील" : "Keeps & updates current data"}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRestoreMode('overwrite')}
                        className={`p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                          restoreMode === 'overwrite'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <div className="font-extrabold">{lang === 'mr' ? "रिप्लेस करा (Overwrite)" : "Replace Entirely"}</div>
                        <div className={`text-[10px] mt-0.5 font-medium ${restoreMode === 'overwrite' ? 'text-rose-100' : 'text-slate-400'}`}>
                          {lang === 'mr' ? "सर्व जुना डेटा काढून टाका" : "Deletes all current data first"}
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>

            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end gap-3 font-sans">
              <button
                type="button"
                onClick={() => {
                  setShowBackupModal(false);
                  setBackupFile(null);
                  setBackupError('');
                  setBackupPreview(null);
                  setBackupParsedData(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
              >
                {lang === 'mr' ? "रद्द करा" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleApplyRestore}
                disabled={!backupParsedData}
                className={`text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer font-sans ${
                  backupParsedData 
                    ? (restoreMode === 'overwrite' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700') 
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  {restoreMode === 'overwrite' 
                    ? (lang === 'mr' ? "पूर्ण ओव्हरराईट लागू करा" : "Confirm Full Overwrite") 
                    : (lang === 'mr' ? "मर्ज डेटा लागू करा" : "Apply Merge Restore")}
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: APP INSTALLATION INSTRUCTIONS */}
      {showInstallInstructions && (
        <div id="pwa-install-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs transition-all">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col animate-in fade-in duration-250">
            
            <div className="bg-gradient-to-r from-emerald-700 to-emerald-800 text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-300" />
                <h3 className="font-extrabold text-base md:text-lg">
                  {lang === 'mr' ? "अँप्लिकेशन मोबाईलवर इंस्टॉल करा" : "Install BLO App on Mobile"}
                </h3>
              </div>
              <button 
                onClick={() => setShowInstallInstructions(false)}
                className="text-slate-200 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 max-h-[80vh] text-slate-700">
              <p className="text-xs text-slate-600 leading-relaxed bg-emerald-50 p-4 rounded-xl border border-emerald-100 font-medium">
                {lang === 'mr' 
                  ? "हे ॲप तुम्ही कोणत्याही अतिरिक्त डाऊनलोडशिवाय थेट तुमच्या मोबाईलच्या होम स्क्रीनवर इंस्टॉल करू शकता. इंटरनेट नसले तरीही हे ॲप कार्य करते." 
                  : "You can install this app directly on your mobile home screen or computer without any app store. It works offline and runs instantly."}
              </p>

              <div className="space-y-4">
                {/* iPhone / Safari */}
                <div className="p-4 border border-slate-100 rounded-xl bg-slate-50 space-y-2">
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <span className="p-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-black">1</span>
                    📱 {lang === 'mr' ? "आयफोन / सफारी (iPhone / iOS Safari)" : "iPhone & iPad (Safari)"}
                  </h4>
                  <ul className="list-disc list-inside text-xs text-slate-600 space-y-1.5 pl-2">
                    <li>{lang === 'mr' ? "सफारी ब्राउझरमध्ये ही लिंक उघडा." : "Open this URL in Safari browser."}</li>
                    <li>{lang === 'mr' ? "खालील 'Share' (शेअर) 📤 बटणावर क्लिक करा." : "Tap the Share button 📤 in the toolbar."}</li>
                    <li>{lang === 'mr' ? "खाली स्क्रोल करून 'Add to Home Screen' (होम स्क्रीनवर जोडा) ➕ निवडा." : "Scroll down and tap 'Add to Home Screen' ➕."}</li>
                    <li>{lang === 'mr' ? "वरती 'Add' (जोडा) वर क्लिक करा." : "Tap 'Add' in the top right corner."}</li>
                  </ul>
                </div>

                {/* Android / Chrome */}
                <div className="p-4 border border-slate-100 rounded-xl bg-slate-50 space-y-2">
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <span className="p-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-black">2</span>
                    🤖 {lang === 'mr' ? "अँड्रॉइड / क्रोम (Android / Chrome)" : "Android Phones (Chrome)"}
                  </h4>
                  <ul className="list-disc list-inside text-xs text-slate-600 space-y-1.5 pl-2">
                    <li>{lang === 'mr' ? "क्रोम ब्राउझरच्या कोपऱ्यातील तीन ठिपक्यांवर (⋮) टॅप करा." : "Tap the three-dots menu (⋮) in Chrome."}</li>
                    <li>{lang === 'mr' ? "'Install app' (अँप इंस्टॉल करा) किंवा 'Add to Home screen' निवडा." : "Select 'Install app' or 'Add to Home Screen'."}</li>
                    <li>{lang === 'mr' ? "दिलेल्या पॉप-अप मध्ये 'Install' वर क्लिक करा." : "Confirm by clicking 'Install'."}</li>
                  </ul>
                </div>

                {/* Desktop */}
                <div className="p-4 border border-slate-100 rounded-xl bg-slate-50 space-y-2">
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <span className="p-1 bg-purple-100 text-purple-800 rounded-lg text-xs font-black">3</span>
                    💻 {lang === 'mr' ? "संगणक / लॅपटॉप (Desktop Chrome / Edge)" : "Computers (Chrome/Edge)"}
                  </h4>
                  <ul className="list-disc list-inside text-xs text-slate-600 space-y-1.5 pl-2">
                    <li>{lang === 'mr' ? "ब्राउझरच्या ॲड्रेस बारच्या उजव्या बाजूला असलेल्या डाऊनलोड आयकॉनवर क्लिक करा." : "Click the Install Icon (computer with arrow down) in the address bar."}</li>
                    <li>{lang === 'mr' ? "किंवा सेटिंग्ज मेनू मधून 'Install BLO Officer Tracker' निवडा." : "Or click the browser menu (⋮) and choose 'Save and share' -> 'Install app'."}</li>
                  </ul>
                </div>
              </div>

            </div>

            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end font-sans">
              <button
                type="button"
                onClick={() => setShowInstallInstructions(false)}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {lang === 'mr' ? "समजले / बंद करा" : "Got it, Close"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
