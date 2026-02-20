import type { ResumeDto, ResumeSection, SectionItem } from "@curriculo/shared";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType
} from "docx";

const sectionSpacing = (resume: ResumeDto): { after: number; line: number } => {
  if (resume.theme.spacing === "compact") {
    return { after: 120, line: 260 };
  }

  return { after: 190, line: 300 };
};

const hexColor = (value: string): string => value.replace("#", "");

const field = (item: SectionItem, key: string): string => item.fields[key]?.trim() ?? "";

const formatItem = (section: ResumeSection, item: SectionItem): string[] => {
  switch (section.type) {
    case "summary":
      return [field(item, "text")];
    case "experience":
      return [
        `${field(item, "role")} - ${field(item, "company")}`,
        `${field(item, "startDate")} - ${field(item, "endDate")} | ${field(item, "location")}`,
        field(item, "description")
      ].filter(Boolean);
    case "education":
      return [
        field(item, "degree"),
        `${field(item, "institution")} | ${field(item, "startDate")} - ${field(item, "endDate")}`,
        field(item, "description")
      ].filter(Boolean);
    case "skills":
      return [field(item, "name")];
    case "projects":
      return [field(item, "name"), field(item, "link"), field(item, "description")].filter(Boolean);
    case "certifications":
      return [`${field(item, "name")} - ${field(item, "issuer")} (${field(item, "year")})`];
    case "languages":
      return [`${field(item, "language")}: ${field(item, "level")}`];
    case "custom": {
      return Object.entries(item.fields)
        .filter(([, value]) => value.trim().length)
        .map(([key, value]) => `${key}: ${value}`);
    }
    default:
      return [];
  }
};

const renderSectionParagraphs = (resume: ResumeDto, section: ResumeSection): Paragraph[] => {
  const spacing = sectionSpacing(resume);

  const heading = new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { after: spacing.after },
    children: [
      new TextRun({
        text: section.title,
        color: hexColor(resume.theme.primaryColor),
        bold: true
      })
    ]
  });

  const items = section.items.flatMap((item) => {
    const lines = formatItem(section, item);

    return lines.map(
      (line, index) =>
        new Paragraph({
          text: line,
          spacing: { after: index === lines.length - 1 ? spacing.after : 60, line: spacing.line }
        })
    );
  });

  if (items.length === 0) {
    items.push(
      new Paragraph({
        text: "Sem conteúdo",
        spacing: { after: spacing.after }
      })
    );
  }

  return [heading, ...items];
};

const buildHeaderParagraphs = (resume: ResumeDto): Paragraph[] => {
  const baseSpacing = sectionSpacing(resume);

  return [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: resume.content.header.fullName,
          color: hexColor(resume.theme.secondaryColor),
          bold: true,
          size: resume.theme.fontSizeLevel === "large" ? 42 : 36
        })
      ]
    }),
    new Paragraph({
      text: resume.content.header.role,
      spacing: { after: 120 }
    }),
    new Paragraph({
      text: [
        resume.content.header.email,
        resume.content.header.phone,
        resume.content.header.location,
        resume.content.header.website,
        resume.content.header.linkedIn,
        resume.content.header.github
      ]
        .filter(Boolean)
        .join(" | "),
      spacing: { after: baseSpacing.after }
    })
  ];
};

const buildProfessionalDocument = (resume: ResumeDto): Document => {
  const sideTypes = new Set(["skills", "languages", "certifications"]);
  const sideSections = resume.content.sections.filter((section) => sideTypes.has(section.type));
  const mainSections = resume.content.sections.filter((section) => !sideTypes.has(section.type));

  const sideContent: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [
        new TextRun({
          text: "Contato",
          color: hexColor(resume.theme.primaryColor),
          bold: true
        })
      ]
    }),
    new Paragraph({ text: resume.content.header.email }),
    new Paragraph({ text: resume.content.header.phone }),
    new Paragraph({ text: resume.content.header.location }),
    new Paragraph({ text: resume.content.header.linkedIn }),
    new Paragraph({ text: resume.content.header.github })
  ];

  sideSections.forEach((section) => {
    sideContent.push(...renderSectionParagraphs(resume, section));
  });

  const mainContent: Paragraph[] = [...buildHeaderParagraphs(resume)];
  mainSections.forEach((section) => {
    mainContent.push(...renderSectionParagraphs(resume, section));
  });

  const table = new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 31, type: WidthType.PERCENTAGE },
            children: sideContent,
            borders: {
              right: { style: BorderStyle.SINGLE, color: hexColor(resume.theme.primaryColor), size: 6 },
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
            }
          }),
          new TableCell({
            width: { size: 69, type: WidthType.PERCENTAGE },
            children: mainContent,
            borders: {
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
            }
          })
        ]
      })
    ]
  });

  return new Document({
    sections: [
      {
        children: [table]
      }
    ]
  });
};

const buildStandardDocument = (resume: ResumeDto): Document => {
  const children: Paragraph[] = [...buildHeaderParagraphs(resume)];

  resume.content.sections.forEach((section) => {
    children.push(...renderSectionParagraphs(resume, section));
  });

  return new Document({
    sections: [
      {
        properties: {},
        children
      }
    ]
  });
};

export const renderResumeDocx = async (resume: ResumeDto): Promise<Buffer> => {
  const doc = resume.templateId === "professional" ? buildProfessionalDocument(resume) : buildStandardDocument(resume);

  return Packer.toBuffer(doc);
};

