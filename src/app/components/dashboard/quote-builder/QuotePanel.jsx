'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import { Textarea } from '@/app/components/ui/textarea';
import { Trash2, FileText } from 'lucide-react';
import LeadSelector from './LeadSelector';

function formatCurrency(value) {
  return `€${(Math.round(Number(value) * 100) / 100).toLocaleString('nl-NL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function QuotePanel({
  lineItems,
  customer,
  discount,
  notes,
  subtotalIncl,
  discountAmount,
  afterDiscount,
  exclBtw,
  btwAmount,
  btwPercentage,
  oplossingen,
  diagnoseDetails,
  oppervlakte,
  defaults,
  onUpdateLine,
  onRemoveLine,
  onCustomerChange,
  onOplossingenChange,
  onDiagnoseDetailsChange,
  onOppervlakteChange,
  onDefaultsChange,
}) {
  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
      {/* Customer info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Klantgegevens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <LeadSelector onSelect={(data) => onCustomerChange(data)} />
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Naam"
              value={customer.name}
              onChange={(e) => onCustomerChange({ name: e.target.value })}
              className="text-sm"
            />
            <Input
              placeholder="E-mail"
              value={customer.email}
              onChange={(e) => onCustomerChange({ email: e.target.value })}
              className="text-sm"
            />
            <Input
              placeholder="Telefoon"
              value={customer.phone}
              onChange={(e) => onCustomerChange({ phone: e.target.value })}
              className="text-sm"
            />
            <Input
              placeholder="Plaatsnaam"
              value={customer.plaatsnaam}
              onChange={(e) => onCustomerChange({ plaatsnaam: e.target.value })}
              className="text-sm"
            />
            <Input
              placeholder="Straat + nr"
              value={customer.straat}
              onChange={(e) => onCustomerChange({ straat: e.target.value })}
              className="text-sm"
            />
            <Input
              placeholder="Postcode"
              value={customer.postcode}
              onChange={(e) => onCustomerChange({ postcode: e.target.value })}
              className="text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Offerte details */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Offerte details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Betreft</label>
            <Input
              placeholder="Bijv. Kelderafdichting"
              value={oplossingen?.join(', ') || ''}
              onChange={(e) => {
                const val = e.target.value;
                onOplossingenChange(val ? val.split(',').map((s) => s.trim()).filter(Boolean) : []);
              }}
              className="text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Diagnose</label>
            <Input
              placeholder="Bijv. Doorslag bij hevige regen"
              value={diagnoseDetails || ''}
              onChange={(e) => onDiagnoseDetailsChange(e.target.value)}
              className="text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Oppervlakte</label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  placeholder="0"
                  value={oppervlakte || ''}
                  onChange={(e) => onOppervlakteChange(e.target.value ? Number(e.target.value) : null)}
                  className="text-sm"
                  min={0}
                  step="any"
                />
                <span className="text-xs text-muted-foreground shrink-0">m²</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Doorlooptijd</label>
              <Input
                placeholder="3 werkdagen"
                value={defaults?.doorlooptijd || ''}
                onChange={(e) => onDefaultsChange({ doorlooptijd: e.target.value })}
                className="text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Garantie</label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  placeholder="5"
                  value={defaults?.garantie_jaren || ''}
                  onChange={(e) => onDefaultsChange({ garantie_jaren: e.target.value ? Number(e.target.value) : 5 })}
                  className="text-sm"
                  min={0}
                />
                <span className="text-xs text-muted-foreground shrink-0">jaar</span>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Betaling</label>
            <Textarea
              placeholder="40% op de eerste werkdag bij aanvang..."
              value={defaults?.betaling || ''}
              onChange={(e) => onDefaultsChange({ betaling: e.target.value })}
              className="text-sm min-h-[60px]"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Line items */}
      <Card className="flex-1">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Offerteregels
              {lineItems.length > 0 && (
                <Badge variant="secondary" className="ml-2">{lineItems.length}</Badge>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {lineItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Begin een gesprek om regels toe te voegen</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lineItems.map((item, index) => {
                const lineTotal = Math.round(Number(item.quantity) * Number(item.unit_price) * 100) / 100;
                return (
                  <div key={item.id} className="group flex items-start gap-2 py-2 border-b last:border-0">
                    <span className="text-xs text-muted-foreground mt-1 w-5 shrink-0">{index + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => onUpdateLine(index, { quantity: Number(e.target.value) || 0 })}
                          className="h-7 w-16 text-xs"
                          min={0}
                          step="any"
                        />
                        <span className="text-xs text-muted-foreground">{item.unit}</span>
                        <span className="text-xs text-muted-foreground">×</span>
                        <Input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => onUpdateLine(index, { unit_price: Number(e.target.value) || 0 })}
                          className="h-7 w-20 text-xs"
                          min={0}
                          step="any"
                        />
                        {item.tier_applied && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">{item.tier_applied}</Badge>
                        )}
                        {item.minimum_applied && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 border-amber-400 text-amber-600">min.</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-sm font-medium">{formatCurrency(lineTotal)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onRemoveLine(index)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Totals */}
      {lineItems.length > 0 && (
        <Card>
          <CardContent className="pt-4 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span>Subtotaal incl. BTW</span>
              <span className="font-medium">{formatCurrency(subtotalIncl)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>
                  Korting
                  {discount?.type === 'percentage' ? ` (${discount.value}%)` : ''}
                </span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-sm">
              <span>Excl. BTW</span>
              <span>{formatCurrency(exclBtw)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>BTW ({btwPercentage}%)</span>
              <span>{formatCurrency(btwAmount)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-bold">
              <span>Totaal incl. BTW</span>
              <span>{formatCurrency(afterDiscount)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Notities</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
