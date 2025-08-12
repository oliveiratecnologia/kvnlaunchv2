import { NextRequest, NextResponse } from 'next/server';
import { generateCompleteEbook, EbookData } from '@/lib/pdf-generator';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('[API /api/ebook/generate] Recebendo solicitação de geração de ebook');
    
    const body = await request.json();
    const { nome, descricao, nicho, subnicho, persona } = body;

    // Validação dos dados obrigatórios
    if (!nome || !descricao || !nicho) {
      console.warn('[API /api/ebook/generate] Dados obrigatórios ausentes');
      return NextResponse.json(
        { error: 'Nome, descrição e nicho são obrigatórios' },
        { status: 400 }
      );
    }

    const ebookData: EbookData = {
      nome,
      descricao,
      nicho,
      subnicho: subnicho || nicho,
      persona
    };

    console.log(`[API /api/ebook/generate] Gerando ebook: ${nome}`);

    // Gerar o ebook completo
    const pdfBuffer = await generateCompleteEbook(ebookData);

    // Gerar nome do arquivo
    const fileName = `${nome.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
    const filePath = `ebooks/${fileName}`;

    console.log(`[API /api/ebook/generate] Salvando PDF no Supabase Storage: ${filePath}`);

    // Upload para Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('ebooks')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('[API /api/ebook/generate] Erro no upload:', uploadError);
      return NextResponse.json(
        { error: 'Erro ao salvar o ebook', details: uploadError.message },
        { status: 500 }
      );
    }

    // Gerar URL pública
    const { data: urlData } = supabase.storage
      .from('ebooks')
      .getPublicUrl(filePath);

    console.log(`[API /api/ebook/generate] Ebook gerado com sucesso: ${urlData.publicUrl}`);

    return NextResponse.json({
      success: true,
      fileName,
      downloadUrl: urlData.publicUrl,
      filePath,
      message: 'Ebook gerado com sucesso!'
    });

  } catch (error) {
    console.error('[API /api/ebook/generate] Erro na geração:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return NextResponse.json(
      { 
        error: 'Erro interno na geração do ebook', 
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

// Endpoint para download direto
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('file');

    if (!filePath) {
      return NextResponse.json(
        { error: 'Parâmetro file é obrigatório' },
        { status: 400 }
      );
    }

    console.log(`[API /api/ebook/generate] Download solicitado: ${filePath}`);

    // Baixar arquivo do Supabase Storage
    const { data, error } = await supabase.storage
      .from('ebooks')
      .download(filePath);

    if (error) {
      console.error('[API /api/ebook/generate] Erro no download:', error);
      return NextResponse.json(
        { error: 'Arquivo não encontrado', details: error.message },
        { status: 404 }
      );
    }

    // Converter para buffer
    const buffer = await data.arrayBuffer();

    // Retornar o PDF
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filePath.split('/').pop()}"`,
        'Cache-Control': 'public, max-age=3600'
      }
    });

  } catch (error) {
    console.error('[API /api/ebook/generate] Erro no download:', error);
    
    return NextResponse.json(
      { error: 'Erro interno no download' },
      { status: 500 }
    );
  }
}
