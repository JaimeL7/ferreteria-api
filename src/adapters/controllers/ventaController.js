export const crearVentaController = (useCases) => ({
  registrar: async (req, res, next) => { try { res.status(201).json({ data: await useCases.registrar(req.body) }); } catch (e) { next(e); } },
  listar: async (req, res, next) => { try { res.json(await useCases.listar(req.query)); } catch (e) { next(e); } },
  obtener: async (req, res, next) => { try { res.json(await useCases.obtenerPorId(req.params.id)); } catch (e) { next(e); } },
});
