import { jsPDF } from 'jspdf'

const BRGY_NAME = 'Barangay Ugong'
const BRGY_CITY = 'Valenzuela City'
const BRGY_PROVINCE = 'Metro Manila'
const BRGY_KAPITANA = 'HON. MARICEL PINEDA'
const BRGY_POSITION = 'Punong Barangay / Tagapangulo ng Lupon'

export interface PaanyayaData {
  caseNumber: string
  natureOfComplaint: string
  blotterNumber: string
  complainantName: string
  respondentName: string
  hearingNumber: number
  date: string
  startTime: string
  endTime: string
  venue: string
  logoBase64?: string
  logoFormat?: 'PNG' | 'JPEG' | 'WEBP'
}

function fmtDate(iso: string): string {
  return new Date(iso + 'T00:00').toLocaleDateString('en-PH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function fmtTime(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

function rule(
  doc: jsPDF,
  y: number,
  left: number,
  right: number,
  gray = 150,
  thick = 0.3,
): void {
  doc.setDrawColor(gray, gray, gray)
  doc.setLineWidth(thick)
  doc.line(left, y, right, y)
}

export function generatePaanyaya(data: PaanyayaData): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const ML = 28
  const MR = 28
  const cW = pageW - ML - MR
  const cx = pageW / 2

  // Watermark
  if (data.logoBase64) {
    const fmt = data.logoFormat ?? 'PNG'
    const size = 80
    const lx = (pageW - size) / 2
    const ly = (pageH - size) / 2
    try {
      doc.setGState(
        new (doc as any).GState({ opacity: 0.08, 'stroke-opacity': 0.08 }),
      )
      doc.addImage(data.logoBase64, fmt, lx, ly, size, size)
      doc.setGState(
        new (doc as any).GState({ opacity: 1, 'stroke-opacity': 1 }),
      )
    } catch {
      doc.addImage(data.logoBase64, fmt, lx, ly, size, size)
    }
  }

  // Letterhead
  let y = 20
  doc.setFontSize(8)
  doc.setFont('times', 'normal')
  doc.setTextColor(90, 90, 90)
  doc.text('Republic of the Philippines', cx, y, { align: 'center' })

  y += 5.5
  doc.setFontSize(14)
  doc.setFont('times', 'bold')
  doc.setTextColor(10, 10, 10)
  doc.text(BRGY_NAME.toUpperCase(), cx, y, { align: 'center' })

  y += 5.5
  doc.setFontSize(9.5)
  doc.setFont('times', 'normal')
  doc.setTextColor(35, 35, 35)
  doc.text(`${BRGY_CITY}, ${BRGY_PROVINCE}`, cx, y, { align: 'center' })

  y += 5
  doc.setFontSize(8.5)
  doc.setTextColor(80, 80, 80)
  doc.text('Office of the Lupong Tagapamayapa', cx, y, { align: 'center' })

  y += 6.5
  rule(doc, y, ML, pageW - MR, 20, 1.4)
  y += 2.2
  rule(doc, y, ML, pageW - MR, 20, 0.4)

  // Title
  y += 13
  doc.setFontSize(18)
  doc.setFont('times', 'bold')
  doc.setTextColor(10, 10, 10)
  doc.text('PAANYAYA', cx, y, { align: 'center' })

  y += 6
  doc.setFontSize(9)
  doc.setFont('times', 'italic')
  doc.setTextColor(90, 90, 90)
  doc.text('(Summon / Notice to Appear)', cx, y, { align: 'center' })

  // Reference Numbers
  y += 10
  rule(doc, y, ML, pageW - MR, 160, 0.3)
  y += 5.5
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(40, 40, 40)
  const today = fmtDate(new Date().toISOString().split('T')[0])
  doc.text(`Case No.:  ${data.blotterNumber}`, ML, y)
  doc.text(`Date Issued:  ${today}`, pageW - MR, y, { align: 'right' })
  y += 5.5
  doc.text(`Summon No.:  ${data.hearingNumber}`, pageW - MR, y, {
    align: 'right',
  })
  y += 5.5
  rule(doc, y, ML, pageW - MR, 160, 0.3)

  // Addressee
  y += 9
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(90, 90, 90)
  doc.text('Kay / To:', ML, y)

  y += 5.5
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(10, 10, 10)
  doc.text(data.respondentName.toUpperCase(), ML, y)

  y += 4.5
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(110, 110, 110)
  doc.text('(Nasasakdal)', ML, y)

  // Body
  y += 12
  doc.setFontSize(10)
  doc.setFont('times', 'normal')
  doc.setTextColor(15, 15, 15)

  const p1 = doc.splitTextToSize(
    `Ipinaaalam sa inyo na ang reklamo laban sa inyo ni ${data.complainantName} ` +
      `kaugnay ng usapin ukol sa "${data.natureOfComplaint}" ay kasalukuyang iniimbestigahan ` +
      `ng Lupong Tagapamayapa ng ${BRGY_NAME}.`,
    cW,
  )
  doc.text(p1, ML, y)

  y += p1.length * 5.5 + 5

  const p2 = doc.splitTextToSize(
    `Kayo ay inaanyayahang lumitaw sa mediasyon/konsiliasyon sa araw at oras na ` +
      `nakatakda sa ibaba. Ang inyong hindi paglitaw nang walang sapat na dahilan ay maaaring ` +
      `magbunga ng mga legal na hakbang alinsunod sa Katarungang Pambarangay (RA 7160).`,
    cW,
  )
  doc.text(p2, ML, y)

  y += p2.length * 5.5 + 7

  // Hearing Details Box
  const BOX_H = 44
  doc.setDrawColor(80, 80, 80)
  doc.setFillColor(252, 252, 252)
  doc.setLineWidth(0.5)
  doc.rect(ML, y, cW, BOX_H, 'FD')

  const boxTopY = y
  y += 8
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(10, 10, 10)
  doc.text('MGA DETALYE NG MEDIASYON  /  HEARING DETAILS', cx, y, {
    align: 'center',
  })

  y += 2.5
  rule(doc, y, ML + 3, pageW - MR - 3, 170, 0.25)

  y += 7
  const lCol = ML + 8
  const rCol = cx + 6
  const lblGap = 30

  const detailRow = (label: string, value: string, xStart: number): void => {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(10, 10, 10)
    doc.text(label, xStart, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(25, 25, 25)
    doc.text(value, xStart + lblGap, y)
  }

  detailRow('Petsa / Date:', fmtDate(data.date), lCol)
  detailRow('Summon Blg.:', `Ika-${data.hearingNumber}`, rCol)

  y += 7
  detailRow(
    'Oras / Time:',
    `${fmtTime(data.startTime)} – ${fmtTime(data.endTime)}`,
    lCol,
  )

  y += 7
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(10, 10, 10)
  doc.text('Lugar / Venue:', lCol, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(25, 25, 25)
  const venueLines = doc.splitTextToSize(data.venue, cx - lCol - lblGap - 4)
  doc.text(venueLines, lCol + lblGap, y)

  y = boxTopY + BOX_H + 10

  // Closing
  doc.setFontSize(10)
  doc.setFont('times', 'normal')
  doc.setTextColor(15, 15, 15)
  doc.text('Umaasa kaming inyong pagsusukuran ang paanyayang ito.', ML, y)

  // Signature
  y += 14
  const sigR = pageW - MR
  doc.setFontSize(10)
  doc.setFont('times', 'normal')
  doc.setTextColor(20, 20, 20)
  doc.text('Taos-pusong gumagalang,', sigR, y, { align: 'right' })

  y += 22
  doc.setDrawColor(30, 30, 30)
  doc.setLineWidth(0.5)
  doc.line(sigR - 60, y, sigR, y)

  y += 5
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(10, 10, 10)
  doc.text(BRGY_KAPITANA, sigR, y, { align: 'right' })

  y += 5
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(100, 100, 100)
  doc.text(BRGY_POSITION, sigR, y, { align: 'right' })

  // Footer
  rule(doc, pageH - 18, ML, pageW - MR, 170, 0.3)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(145, 145, 145)
  doc.text(
    `Lupong Tagapamayapa  ·  ${BRGY_NAME}, ${BRGY_CITY}  ·  Case No. ${data.caseNumber}`,
    cx,
    pageH - 12,
    { align: 'center' },
  )
  doc.text(
    'This document is strictly confidential and intended solely for the named recipient.',
    cx,
    pageH - 8,
    { align: 'center' },
  )

  doc.save(`Paanyaya_${data.blotterNumber}_Summon${data.hearingNumber}.pdf`)
}
