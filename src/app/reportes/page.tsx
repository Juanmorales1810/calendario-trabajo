'use client';

import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { minutesToDisplay, calculateSalaryEstimate } from '@/lib/time-utils';
import { BarChart3, Clock, TrendingUp, DollarSign, Download } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart, Cell, Label as RechartsLabel } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const weeklyChartConfig = {
    regular: { label: 'Horas regulares', theme: { light: '#2563eb', dark: '#60a5fa' } },
    extra: { label: 'Horas extras', theme: { light: '#d97706', dark: '#fbbf24' } },
} satisfies ChartConfig;

interface WorkEntry {
    _id: string;
    fecha: string;
    dia: string;
    entrada: string;
    salida: string;
    horasTurno: number;
    horasLaborales: number;
    horasExtras: number;
    ubicacion: string;
    horasTurno2: number;
    observaciones?: string;
}

interface UserSettingsData {
    salarioMensual: number;
    horasJornada: number;
    moneda: string;
}

const meses = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
];

const currentYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

export default function ReportesPage() {
    const { data: session, isPending } = useSession();
    const router = useRouter();
    const [entries, setEntries] = useState<WorkEntry[]>([]);
    const [settings, setSettings] = useState<UserSettingsData | null>(null);
    const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isPending && !session) {
            router.push('/login');
        }
    }, [session, isPending, router]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [entriesRes, settingsRes] = await Promise.all([
                fetch(`/api/work-entries?mes=${selectedMonth}&anio=${selectedYear}`),
                fetch('/api/settings'),
            ]);
            if (entriesRes.ok) setEntries(await entriesRes.json());
            if (settingsRes.ok) setSettings(await settingsRes.json());
        } catch {
            // silenced
        } finally {
            setLoading(false);
        }
    }, [selectedMonth, selectedYear]);

    useEffect(() => {
        if (session) fetchData();
    }, [session, fetchData]);

    // Calculations — single pass over entries (js-combine-iterations + rerender-memo)
    const {
        totalTurno1,
        totalTurno2,
        totalTrabajadas,
        totalExtras,
        totalLaborales,
        diasTrabajados,
        weeklyData,
        ubicacionData,
    } = useMemo(() => {
        let t1 = 0,
            t2 = 0,
            extras = 0,
            laborales = 0,
            dias = 0;
        const weekly: Record<string, { horas: number; extras: number; dias: number }> = {};
        const ubicacion: Record<string, number> = {};

        for (const e of entries) {
            const eT1 = e.horasTurno || 0;
            const eT2 = e.horasTurno2 || 0;
            t1 += eT1;
            t2 += eT2;
            extras += e.horasExtras || 0;
            laborales += e.horasLaborales || 0;
            if (eT1 > 0 || eT2 > 0) dias++;

            const date = new Date(e.fecha);
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay() + 1);
            const key = weekStart.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
            if (!weekly[key]) weekly[key] = { horas: 0, extras: 0, dias: 0 };
            weekly[key].horas += eT1 + eT2;
            weekly[key].extras += e.horasExtras || 0;
            if (eT1 > 0 || eT2 > 0) weekly[key].dias++;

            const ub = e.ubicacion || 'Sin ubicación';
            ubicacion[ub] = (ubicacion[ub] || 0) + eT1 + eT2;
        }

        return {
            totalTurno1: t1,
            totalTurno2: t2,
            totalTrabajadas: t1 + t2,
            totalExtras: extras,
            totalLaborales: laborales,
            diasTrabajados: dias,
            weeklyData: weekly,
            ubicacionData: ubicacion,
        };
    }, [entries]);

    const weeklyChartData = useMemo(
        () =>
            Object.entries(weeklyData).map(([week, d]) => ({
                week,
                regular: Math.round(((d.horas - d.extras) / 60) * 10) / 10,
                extra: Math.round((d.extras / 60) * 10) / 10,
            })),
        [weeklyData]
    );

    const { locationChartData, locationConfig } = useMemo(() => {
        const sorted = Object.entries(ubicacionData)
            .filter(([, mins]) => mins > 0)
            .sort((a, b) => b[1] - a[1]);
        const data = sorted.map(([name, mins], i) => ({
            name,
            horas: Math.round((mins / 60) * 10) / 10,
            fill: `var(--chart-${(i % 5) + 1})`,
        }));
        const config: ChartConfig = { horas: { label: 'Horas' } };
        sorted.forEach(([name], i) => {
            config[name] = { label: name, color: `var(--chart-${(i % 5) + 1})` };
        });
        return { locationChartData: data, locationConfig: config };
    }, [ubicacionData]);

    if (isPending) {
        return (
            <div className="container mx-auto space-y-6 px-4 py-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-[150px]" />
                        <Skeleton className="h-10 w-[100px]" />
                    </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 rounded-lg" />
                    ))}
                </div>
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-36 w-full rounded-lg" />
            </div>
        );
    }

    if (!session) return null;

    const salary =
        settings?.salarioMensual && settings.salarioMensual > 0
            ? calculateSalaryEstimate(
                  settings.salarioMensual,
                  settings.horasJornada,
                  totalLaborales,
                  totalExtras
              )
            : null;

    const moneda = settings?.moneda || 'USD';
    const avgHorasPerDay = diasTrabajados > 0 ? totalTrabajadas / diasTrabajados : 0;

    const mesNombre = meses[selectedMonth - 1];
    const periodoLabel = `${mesNombre}_${selectedYear}`;

    async function downloadExcel() {
        const ExcelJS = await import('exceljs');
        const { saveAs } = await import('file-saver');

        const wb = new ExcelJS.Workbook();
        wb.creator = 'Calendario Trabajo';
        wb.created = new Date();

        const headerFill = {
            type: 'pattern' as const,
            pattern: 'solid' as const,
            fgColor: { argb: '3B82F6' },
        };
        const headerFont = { bold: true, color: { argb: 'FFFFFF' }, size: 10 };
        const titleFont = { bold: true, size: 14, color: { argb: '1E3A5F' } };
        const subtitleFont = { bold: true, size: 11, color: { argb: '3B82F6' } };
        const totalsFill = {
            type: 'pattern' as const,
            pattern: 'solid' as const,
            fgColor: { argb: 'E8F0FE' },
        };
        const totalsFont = { bold: true, size: 10 };
        const thinBorder = {
            top: { style: 'thin' as const, color: { argb: 'D1D5DB' } },
            left: { style: 'thin' as const, color: { argb: 'D1D5DB' } },
            bottom: { style: 'thin' as const, color: { argb: 'D1D5DB' } },
            right: { style: 'thin' as const, color: { argb: 'D1D5DB' } },
        };
        const zebraFill = {
            type: 'pattern' as const,
            pattern: 'solid' as const,
            fgColor: { argb: 'F9FAFB' },
        };

        // ========== Sheet 1: Detalle ==========
        const ws = wb.addWorksheet('Detalle');
        const colCount = 10;

        // Title row
        ws.mergeCells(1, 1, 1, colCount);
        const titleCell = ws.getCell('A1');
        titleCell.value = `Reporte de Horas — ${mesNombre} ${selectedYear}`;
        titleCell.font = titleFont;
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        ws.getRow(1).height = 30;

        // Empty row
        ws.getRow(2).height = 8;

        // Headers (row 3)
        const headers = [
            'Fecha',
            'Día',
            'Entrada',
            'Salida',
            'Turno',
            'Laboral',
            'Extras',
            'Ubicación',
            'Turno 2',
            'Observaciones',
        ];
        const headerRow = ws.getRow(3);
        headers.forEach((h, i) => {
            const cell = headerRow.getCell(i + 1);
            cell.value = h;
            cell.font = headerFont;
            cell.fill = headerFill;
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = thinBorder;
        });
        headerRow.height = 22;

        // Data rows
        entries.forEach((e, idx) => {
            const fecha = new Date(e.fecha).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            });
            const row = ws.getRow(4 + idx);
            const values = [
                fecha,
                e.dia,
                e.entrada || '-',
                e.salida || '-',
                minutesToDisplay(e.horasTurno),
                minutesToDisplay(e.horasLaborales),
                minutesToDisplay(e.horasExtras),
                e.ubicacion || '-',
                e.horasTurno2 > 0 ? minutesToDisplay(e.horasTurno2) : '-',
                e.observaciones || '-',
            ];
            values.forEach((v, i) => {
                const cell = row.getCell(i + 1);
                cell.value = v;
                cell.border = thinBorder;
                cell.alignment = {
                    horizontal: i === 0 || i >= 7 ? 'left' : 'center',
                    vertical: 'middle',
                };
                if (idx % 2 === 1) cell.fill = zebraFill;
            });
            // Highlight extras
            if (e.horasExtras > 0) {
                const extrasCell = row.getCell(7);
                extrasCell.font = { bold: true, color: { argb: 'D97706' } };
            }
        });

        // Totals row
        const totalsRowNum = 4 + entries.length + 1;
        ws.getRow(4 + entries.length).height = 6; // spacer
        const tRow = ws.getRow(totalsRowNum);
        const totalsValues = [
            'TOTALES',
            '',
            '',
            '',
            minutesToDisplay(totalTurno1),
            minutesToDisplay(totalLaborales),
            minutesToDisplay(totalExtras),
            '',
            minutesToDisplay(totalTurno2),
            '',
        ];
        totalsValues.forEach((v, i) => {
            const cell = tRow.getCell(i + 1);
            cell.value = v;
            cell.font = totalsFont;
            cell.fill = totalsFill;
            cell.border = thinBorder;
            cell.alignment = { horizontal: i === 0 ? 'left' : 'center', vertical: 'middle' };
        });
        tRow.height = 22;

        // Column widths
        ws.columns = [
            { width: 14 },
            { width: 12 },
            { width: 10 },
            { width: 10 },
            { width: 10 },
            { width: 10 },
            { width: 10 },
            { width: 18 },
            { width: 10 },
            { width: 25 },
        ];

        // ========== Sheet 2: Resumen ==========
        const wsR = wb.addWorksheet('Resumen');

        wsR.mergeCells('A1:B1');
        const rTitle = wsR.getCell('A1');
        rTitle.value = `Resumen — ${mesNombre} ${selectedYear}`;
        rTitle.font = titleFont;
        rTitle.alignment = { horizontal: 'center', vertical: 'middle' };
        wsR.getRow(1).height = 30;
        wsR.getRow(2).height = 8;

        // Summary headers
        const rHeaders = wsR.getRow(3);
        ['Concepto', 'Valor'].forEach((h, i) => {
            const cell = rHeaders.getCell(i + 1);
            cell.value = h;
            cell.font = headerFont;
            cell.fill = headerFill;
            cell.alignment = { horizontal: 'center' };
            cell.border = thinBorder;
        });

        const summaryItems: [string, string | number][] = [
            ['Días trabajados', diasTrabajados],
            ['Total horas trabajadas', minutesToDisplay(totalTrabajadas)],
            ['Horas turno 1', minutesToDisplay(totalTurno1)],
            ['Horas turno 2', minutesToDisplay(totalTurno2)],
            ['Horas laborales', minutesToDisplay(totalLaborales)],
            ['Horas extras', minutesToDisplay(totalExtras)],
            ['Promedio diario', minutesToDisplay(Math.round(avgHorasPerDay))],
        ];

        summaryItems.forEach(([label, val], idx) => {
            const row = wsR.getRow(4 + idx);
            const c1 = row.getCell(1);
            c1.value = label;
            c1.border = thinBorder;
            const c2 = row.getCell(2);
            c2.value = val;
            c2.border = thinBorder;
            c2.alignment = { horizontal: 'center' };
            if (idx % 2 === 1) {
                c1.fill = zebraFill;
                c2.fill = zebraFill;
            }
        });

        let salaryStartRow = 4 + summaryItems.length + 1;
        if (salary) {
            wsR.getRow(salaryStartRow).height = 8;
            salaryStartRow++;
            wsR.mergeCells(salaryStartRow, 1, salaryStartRow, 2);
            const salTitle = wsR.getCell(salaryStartRow, 1);
            salTitle.value = 'Desglose Salarial';
            salTitle.font = subtitleFont;
            salTitle.alignment = { horizontal: 'center' };
            salaryStartRow++;

            const salaryHeaders = wsR.getRow(salaryStartRow);
            ['Concepto', 'Valor'].forEach((h, i) => {
                const cell = salaryHeaders.getCell(i + 1);
                cell.value = h;
                cell.font = headerFont;
                cell.fill = headerFill;
                cell.alignment = { horizontal: 'center' };
                cell.border = thinBorder;
            });
            salaryStartRow++;

            const salaryItems: [string, string][] = [
                [
                    'Salario mensual',
                    `${moneda} ${settings!.salarioMensual.toLocaleString('es-ES')}`,
                ],
                ['Salario/hora', `${moneda} ${salary.salarioHora.toLocaleString('es-ES')}`],
                ['Salario/día', `${moneda} ${salary.salarioDiario.toLocaleString('es-ES')}`],
                ['Salario base mes', `${moneda} ${salary.salarioBase.toLocaleString('es-ES')}`],
                ['Pago extras (x1.5)', `${moneda} ${salary.pagoExtras.toLocaleString('es-ES')}`],
            ];
            salaryItems.forEach(([label, val], idx) => {
                const row = wsR.getRow(salaryStartRow + idx);
                const c1 = row.getCell(1);
                c1.value = label;
                c1.border = thinBorder;
                const c2 = row.getCell(2);
                c2.value = val;
                c2.border = thinBorder;
                c2.alignment = { horizontal: 'center' };
                if (idx % 2 === 1) {
                    c1.fill = zebraFill;
                    c2.fill = zebraFill;
                }
            });

            // Total row highlighted
            const totalSalRow = wsR.getRow(salaryStartRow + salaryItems.length);
            const tc1 = totalSalRow.getCell(1);
            tc1.value = 'Total estimado';
            tc1.font = totalsFont;
            tc1.fill = totalsFill;
            tc1.border = thinBorder;
            const tc2 = totalSalRow.getCell(2);
            tc2.value = `${moneda} ${salary.totalEstimado.toLocaleString('es-ES')}`;
            tc2.font = { bold: true, color: { argb: '059669' }, size: 11 };
            tc2.fill = totalsFill;
            tc2.border = thinBorder;
            tc2.alignment = { horizontal: 'center' };
        }

        wsR.getColumn(1).width = 26;
        wsR.getColumn(2).width = 22;

        // ========== Sheet 3: Semanal ==========
        if (Object.keys(weeklyData).length > 0) {
            const wsW = wb.addWorksheet('Semanal');
            wsW.mergeCells('A1:D1');
            const wTitle = wsW.getCell('A1');
            wTitle.value = `Resumen Semanal — ${mesNombre} ${selectedYear}`;
            wTitle.font = titleFont;
            wTitle.alignment = { horizontal: 'center', vertical: 'middle' };
            wsW.getRow(1).height = 30;
            wsW.getRow(2).height = 8;

            const wHeaders = wsW.getRow(3);
            ['Semana del', 'Días', 'Horas', 'Extras'].forEach((h, i) => {
                const cell = wHeaders.getCell(i + 1);
                cell.value = h;
                cell.font = headerFont;
                cell.fill = headerFill;
                cell.alignment = { horizontal: 'center' };
                cell.border = thinBorder;
            });

            Object.entries(weeklyData).forEach(([week, data], idx) => {
                const row = wsW.getRow(4 + idx);
                [
                    week,
                    data.dias,
                    minutesToDisplay(data.horas),
                    minutesToDisplay(data.extras),
                ].forEach((v, i) => {
                    const cell = row.getCell(i + 1);
                    cell.value = v;
                    cell.border = thinBorder;
                    cell.alignment = { horizontal: 'center' };
                    if (idx % 2 === 1) cell.fill = zebraFill;
                });
                if (data.extras > 0) {
                    row.getCell(4).font = { bold: true, color: { argb: 'D97706' } };
                }
            });

            wsW.getColumn(1).width = 16;
            wsW.getColumn(2).width = 10;
            wsW.getColumn(3).width = 12;
            wsW.getColumn(4).width = 12;
        }

        // ========== Sheet 4: Ubicación ==========
        if (Object.keys(ubicacionData).length > 0) {
            const wsL = wb.addWorksheet('Ubicación');
            wsL.mergeCells('A1:C1');
            const lTitle = wsL.getCell('A1');
            lTitle.value = `Horas por Ubicación — ${mesNombre} ${selectedYear}`;
            lTitle.font = titleFont;
            lTitle.alignment = { horizontal: 'center', vertical: 'middle' };
            wsL.getRow(1).height = 30;
            wsL.getRow(2).height = 8;

            const lHeaders = wsL.getRow(3);
            ['Ubicación', 'Horas', '% del Total'].forEach((h, i) => {
                const cell = lHeaders.getCell(i + 1);
                cell.value = h;
                cell.font = headerFont;
                cell.fill = headerFill;
                cell.alignment = { horizontal: 'center' };
                cell.border = thinBorder;
            });

            const sortedLocs = Object.entries(ubicacionData)
                .filter(([, mins]) => mins > 0)
                .sort((a, b) => b[1] - a[1]);
            sortedLocs.forEach(([ub, mins], idx) => {
                const pct = totalTrabajadas > 0 ? Math.round((mins / totalTrabajadas) * 100) : 0;
                const row = wsL.getRow(4 + idx);
                [ub, minutesToDisplay(mins), `${pct}%`].forEach((v, i) => {
                    const cell = row.getCell(i + 1);
                    cell.value = v;
                    cell.border = thinBorder;
                    cell.alignment = { horizontal: i === 0 ? 'left' : 'center' };
                    if (idx % 2 === 1) cell.fill = zebraFill;
                });
            });

            wsL.getColumn(1).width = 22;
            wsL.getColumn(2).width = 12;
            wsL.getColumn(3).width = 14;
        }

        // Download
        const buffer = await wb.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        saveAs(blob, `Reporte_${periodoLabel}.xlsx`);
    }

    async function downloadPDF() {
        const { jsPDF } = await import('jspdf');
        const autoTable = (await import('jspdf-autotable')).default;

        const doc = new jsPDF({ orientation: 'landscape' });

        // Title
        doc.setFontSize(16);
        doc.text(`Reporte de Horas - ${mesNombre} ${selectedYear}`, 14, 18);

        // Summary
        doc.setFontSize(10);
        const summaryLines = [
            `Días trabajados: ${diasTrabajados}`,
            `Total horas: ${minutesToDisplay(totalTrabajadas)}`,
            `Horas extras: ${minutesToDisplay(totalExtras)}`,
            `Promedio diario: ${minutesToDisplay(Math.round(avgHorasPerDay))}`,
        ];
        if (salary) {
            summaryLines.push(
                `Estimado total: ${moneda} ${salary.totalEstimado.toLocaleString('es-ES')}`
            );
        }
        doc.text(summaryLines, 14, 26);

        // Table
        const tableHead = [
            [
                'Fecha',
                'Día',
                'Entrada',
                'Salida',
                'Turno',
                'Laboral',
                'Extras',
                'Ubicación',
                'Turno 2',
                'Obs.',
            ],
        ];
        const tableBody = entries.map((e) => {
            const fecha = new Date(e.fecha).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            });
            return [
                fecha,
                e.dia,
                e.entrada || '-',
                e.salida || '-',
                minutesToDisplay(e.horasTurno),
                minutesToDisplay(e.horasLaborales),
                minutesToDisplay(e.horasExtras),
                e.ubicacion || '-',
                e.horasTurno2 > 0 ? minutesToDisplay(e.horasTurno2) : '-',
                e.observaciones || '-',
            ];
        });

        autoTable(doc, {
            head: tableHead,
            body: tableBody,
            startY: 26 + summaryLines.length * 5,
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246], fontSize: 8 },
            bodyStyles: { fontSize: 7 },
            styles: { cellPadding: 2 },
        });

        // Weekly summary on new page if data exists
        if (Object.keys(weeklyData).length > 0) {
            doc.addPage();
            doc.setFontSize(14);
            doc.text('Resumen por Semana', 14, 18);

            autoTable(doc, {
                head: [['Semana del', 'Días', 'Horas', 'Extras']],
                body: Object.entries(weeklyData).map(([week, data]) => [
                    week,
                    data.dias.toString(),
                    minutesToDisplay(data.horas),
                    minutesToDisplay(data.extras),
                ]),
                startY: 24,
                theme: 'grid',
                headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
                bodyStyles: { fontSize: 8 },
            });
        }

        doc.save(`Reporte_${periodoLabel}.pdf`);
    }

    return (
        <div className="container mx-auto space-y-6 px-4 py-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                        <BarChart3 className="text-primary h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Reportes</h1>
                        <p className="text-muted-foreground text-sm">
                            Resumen detallado de horas y facturación
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={loading || entries.length === 0}>
                                <Download className="mr-2 h-4 w-4" />
                                Descargar
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={downloadExcel}>
                                Descargar Excel (.xlsx)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={downloadPDF}>Descargar PDF</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Select
                        value={selectedMonth.toString()}
                        onValueChange={(v) => setSelectedMonth(Number(v))}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {meses.map((mes, i) => (
                                <SelectItem key={i} value={(i + 1).toString()}>
                                    {mes}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={selectedYear.toString()}
                        onValueChange={(v) => setSelectedYear(Number(v))}>
                        <SelectTrigger className="w-[100px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {currentYears.map((y) => (
                                <SelectItem key={y} value={y.toString()}>
                                    {y}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {loading ? (
                <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-20 rounded-lg" />
                        ))}
                    </div>
                    <Skeleton className="h-48 w-full rounded-lg" />
                    <Skeleton className="h-48 w-full rounded-lg" />
                    <Skeleton className="h-36 w-full rounded-lg" />
                </div>
            ) : (
                <>
                    {/* Summary cards */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="bg-card rounded-lg border p-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                    <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Total horas</p>
                                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                        {minutesToDisplay(totalTrabajadas)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-card rounded-lg border p-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                                    <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Horas extras</p>
                                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                                        {minutesToDisplay(totalExtras)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-card rounded-lg border p-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                                    <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Promedio diario</p>
                                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                        {minutesToDisplay(Math.round(avgHorasPerDay))}
                                    </p>
                                </div>
                            </div>
                        </div>
                        {salary && (
                            <div className="bg-card rounded-lg border p-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                        <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">
                                            Estimado total
                                        </p>
                                        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                            {moneda} {salary.totalEstimado.toLocaleString('es-ES')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Salary breakdown */}
                    {salary && (
                        <div className="bg-card rounded-lg border p-6">
                            <h2 className="mb-4 text-lg font-medium">Desglose salarial</h2>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                                <div className="bg-muted/50 rounded-md p-4">
                                    <p className="text-muted-foreground text-xs">Salario diario</p>
                                    <p className="mt-1 text-lg font-bold">
                                        {moneda} {salary.salarioDiario.toLocaleString('es-ES')}
                                    </p>
                                </div>
                                <div className="bg-muted/50 rounded-md p-4">
                                    <p className="text-muted-foreground text-xs">Salario/hora</p>
                                    <p className="mt-1 text-lg font-bold">
                                        {moneda} {salary.salarioHora.toLocaleString('es-ES')}
                                    </p>
                                </div>
                                <div className="bg-muted/50 rounded-md p-4">
                                    <p className="text-muted-foreground text-xs">Salario base</p>
                                    <p className="mt-1 text-lg font-bold">
                                        {moneda} {salary.salarioBase.toLocaleString('es-ES')}
                                    </p>
                                </div>
                                <div className="bg-muted/50 rounded-md p-4">
                                    <p className="text-muted-foreground text-xs">
                                        Pago extras (x1.5)
                                    </p>
                                    <p className="mt-1 text-lg font-bold text-amber-600 dark:text-amber-400">
                                        {moneda} {salary.pagoExtras.toLocaleString('es-ES')}
                                    </p>
                                </div>
                                <div className="rounded-md bg-emerald-50 p-4 dark:bg-emerald-900/20">
                                    <p className="text-muted-foreground text-xs">Total estimado</p>
                                    <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                        {moneda} {salary.totalEstimado.toLocaleString('es-ES')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Weekly breakdown */}
                    <div className="bg-card rounded-lg border p-6">
                        <h2 className="mb-4 text-lg font-medium">Resumen por semana</h2>
                        {Object.keys(weeklyData).length > 0 ? (
                            <div className="space-y-6">
                                <ChartContainer
                                    config={weeklyChartConfig}
                                    className="aspect-auto h-[220px] w-full">
                                    <BarChart data={weeklyChartData}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis
                                            dataKey="week"
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={8}
                                        />
                                        <ChartTooltip
                                            content={
                                                <ChartTooltipContent
                                                    labelFormatter={(v) => `Semana del ${v}`}
                                                    formatter={(value, name) => [
                                                        ` ${value} h`,
                                                        weeklyChartConfig[
                                                            name as keyof typeof weeklyChartConfig
                                                        ]?.label ?? name,
                                                    ]}
                                                />
                                            }
                                        />
                                        <Bar
                                            dataKey="regular"
                                            stackId="horas"
                                            fill="var(--color-regular)"
                                            radius={[0, 0, 4, 4]}
                                        />
                                        <Bar
                                            dataKey="extra"
                                            stackId="horas"
                                            fill="var(--color-extra)"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ChartContainer>
                                <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-muted/50 border-b">
                                            <th className="px-4 py-2 text-left font-medium">
                                                Semana del
                                            </th>
                                            <th className="px-4 py-2 text-left font-medium">
                                                Días
                                            </th>
                                            <th className="px-4 py-2 text-left font-medium">
                                                Horas
                                            </th>
                                            <th className="px-4 py-2 text-left font-medium">
                                                Extras
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(weeklyData).map(([week, data]) => (
                                            <tr key={week} className="border-b last:border-b-0">
                                                <td className="px-4 py-2">{week}</td>
                                                <td className="px-4 py-2">{data.dias}</td>
                                                <td className="px-4 py-2">
                                                    {minutesToDisplay(data.horas)}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <span
                                                        className={
                                                            data.extras > 0
                                                                ? 'font-medium text-amber-600 dark:text-amber-400'
                                                                : 'text-muted-foreground'
                                                        }>
                                                        {minutesToDisplay(data.extras)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                </div>
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                No hay datos para este período
                            </p>
                        )}
                    </div>

                    {/* Location breakdown */}
                    <div className="bg-card rounded-lg border p-6">
                        <h2 className="mb-4 text-lg font-medium">Horas por ubicación</h2>
                        {locationChartData.length > 0 ? (
                            <div className="flex flex-col items-center gap-6 sm:flex-row">
                                <ChartContainer
                                    config={locationConfig}
                                    className="aspect-square h-[200px] w-full max-w-[200px] shrink-0">
                                    <PieChart>
                                        <ChartTooltip
                                            content={
                                                <ChartTooltipContent
                                                    hideLabel
                                                    formatter={(value, name) => [
                                                        ` ${value} h`,
                                                        name,
                                                    ]}
                                                />
                                            }
                                        />
                                        <Pie
                                            data={locationChartData}
                                            dataKey="horas"
                                            nameKey="name"
                                            innerRadius={55}
                                            outerRadius={80}
                                            strokeWidth={2}>
                                            {locationChartData.map((entry) => (
                                                <Cell key={entry.name} fill={entry.fill} />
                                            ))}
                                            <RechartsLabel
                                                content={({ viewBox }) => {
                                                    if (
                                                        !viewBox ||
                                                        !('cx' in viewBox) ||
                                                        viewBox.cx == null ||
                                                        viewBox.cy == null
                                                    )
                                                        return null;
                                                    return (
                                                        <text
                                                            x={viewBox.cx}
                                                            y={viewBox.cy}
                                                            textAnchor="middle"
                                                            dominantBaseline="middle">
                                                            <tspan
                                                                x={viewBox.cx}
                                                                y={viewBox.cy}
                                                                className="fill-foreground text-lg font-bold">
                                                                {minutesToDisplay(totalTrabajadas)}
                                                            </tspan>
                                                            <tspan
                                                                x={viewBox.cx}
                                                                y={(viewBox.cy ?? 0) + 18}
                                                                className="fill-muted-foreground text-xs">
                                                                total
                                                            </tspan>
                                                        </text>
                                                    );
                                                }}
                                            />
                                        </Pie>
                                    </PieChart>
                                </ChartContainer>
                                <div className="w-full space-y-2">
                                    {Object.entries(ubicacionData)
                                        .filter(([, mins]) => mins > 0)
                                        .sort((a, b) => b[1] - a[1])
                                        .map(([ubicacion, mins], i) => {
                                            const pct =
                                                totalTrabajadas > 0
                                                    ? (mins / totalTrabajadas) * 100
                                                    : 0;
                                            return (
                                                <div
                                                    key={ubicacion}
                                                    className="flex items-center justify-between text-sm">
                                                    <span className="flex items-center gap-2">
                                                        <span
                                                            className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                                                            style={{
                                                                backgroundColor: `var(--chart-${(i % 5) + 1})`,
                                                            }}
                                                        />
                                                        {ubicacion}
                                                    </span>
                                                    <span className="text-muted-foreground">
                                                        {minutesToDisplay(mins)} ({Math.round(pct)}
                                                        %)
                                                    </span>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                No hay datos para este período
                            </p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
