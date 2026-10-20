export const crearClienteController = (useCases) => ({
  crear: async (req, res, next) => { try { res.status(201).json({ data: await useCases.crear(req.body) }); } catch (e) { next(e); } },
  listar: async (req, res, next) => { try { res.json(await useCases.listar(req.query)); } catch (e) { next(e); } },
  obtener: async (req, res, next) => { try { res.json(await useCases.obtenerPorId(req.params.id)); } catch (e) { next(e); } },
  actualizar: async (req, res, next) => { try { res.json({ data: await useCases.actualizar(req.params.id, req.body) }); } catch (e) { next(e); } },
  desactivar: async (req, res, next) => { try { res.json({ data: await useCases.desactivar(req.params.id) }); } catch (e) { next(e); } },
});
