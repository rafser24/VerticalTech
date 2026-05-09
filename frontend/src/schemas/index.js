import { z } from 'zod';

export const loginSchema = z.object({
  // Se quitó .usuario(), se usa string simple con min(1)
  usuario: z.string().min(1, 'Usuario requerido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

export const productSchema = z.object({
  nombre: z.string().min(2, 'Nombre mínimo 2 caracteres').max(100),
  descripcion: z.string().max(500).optional(),
  precio_venta: z.coerce.number().positive('El precio debe ser positivo'),
  stock: z.coerce.number().int().min(0, 'El stock no puede ser negativo'),
  stock_minimo: z.coerce.number().int().min(0).optional(),
  categoria_id: z.coerce.number().int().positive('Seleccione una categoría'),
  proveedor_id: z.coerce.number().int().positive('Seleccione un proveedor').optional(),
  codigo: z.string().max(50).optional(),
  unidad: z.string().max(20).optional(),
});

export const categorySchema = z.object({
  nombre: z.string().min(2, 'Nombre mínimo 2 caracteres').max(100),
  descripcion: z.string().max(300).optional(),
});


export const supplierSchema = z.object({
  nombre: z.string()
    .min(2, 'El nombre comercial es obligatorio')
    .max(120),
    
  razon_social: z.string()
    .min(2, 'La razón social es obligatoria')
    .max(200),
    
  nit: z.string()
    .min(1, 'El NIT es obligatorio')
    .regex(/^\d{4}-\d{6}-\d{3}-\d{1}$/, 'Formato incorrecto (ej. 0614-000000-000-0)'),
    
  email: z.string()
    .min(1, 'El correo es obligatorio')
    .email('Formato de correo inválido'),
    
  telefono: z.string()
    .min(1, 'El teléfono es obligatorio')
    .regex(/^\d{4}-\d{4}$/, 'Debe tener 8 números (ej. 2222-3333)'),
    
  direccion: z.string()
    .min(5, 'La dirección es obligatoria')
    .max(250),
    
  contacto: z.string()
    .min(2, 'El nombre de contacto es obligatorio')
    .max(100),
});

export const clientSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  apellido: z.string().min(1, 'El apellido es obligatorio').max(100),
  email: z.string().min(1, 'El correo es obligatorio').email('Email inválido').max(150),
  telefono: z.string().regex(/^\d{8}$/, 'El teléfono debe tener exactamente 8 números'),
  direccion: z.string().min(1, 'La dirección es obligatoria').max(255),
  dui: z.string().regex(/^\d{8}-\d$/, 'El formato del DUI debe ser 12345678-9'),
  limite_credito: z.coerce.number().min(0, 'No puede ser negativo').optional(),
});

export const userSchema = z.object({
  name: z.string().min(2, 'Nombre mínimo 2 caracteres').max(100),
  email: z.string().email('Email inválido'), // Cambiado a .email()
  password: z.string().min(8, 'Mínimo 8 caracteres').optional().or(z.literal('')),
  role: z.enum(['admin', 'user'], { required_error: 'Seleccione un rol' }),
  is_active: z.boolean().default(true),
});

export const purchaseSchema = z.object({
  supplier_id: z.coerce.number().int().positive('Seleccione un proveedor'),
  payment_method_id: z.coerce.number().int().positive('Seleccione método de pago'),
  notes: z.string().max(500).optional(),
  items: z.array(z.object({
    product_id: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().positive('Cantidad mínima 1'),
    unit_price: z.coerce.number().positive('Precio debe ser positivo'),
  })).min(1, 'Agregue al menos un producto'),
});

export const saleSchema = z.object({
  client_id: z.coerce.number().int().positive('Seleccione un cliente').optional(),
  payment_method_id: z.coerce.number().int().positive('Seleccione método de pago'),
  discount: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().max(500).optional(),
  items: z.array(z.object({
    product_id: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().positive('Cantidad mínima 1'),
    unit_price: z.coerce.number().positive('Precio debe ser positivo'),
  })).min(1, 'Agregue al menos un producto'),
});